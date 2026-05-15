import type { TTreeFilters, TTreeNode } from '@/types/store';

export type TWorkerFilterResult = {
  id?: number;
  data: TTreeNode | null;
  filterTime: number;
};

export class FilterCancelledError extends Error {
  constructor() {
    super('Filter cancelled');
    this.name = 'FilterCancelledError';
  }
}

export const isFilterCancelledError = (error: unknown): error is FilterCancelledError => {
  return error instanceof FilterCancelledError;
};

export class DocumentFilterPipeline {
  private worker: Worker | null = null;
  private requestId = 0;
  private activeRequestId = 0;
  private resolvePending: ((result: TWorkerFilterResult) => void) | null = null;
  private rejectPending: ((error: FilterCancelledError) => void) | null = null;
  private fallbackRoot: TTreeNode | null = null;

  public filter(root: TTreeNode | null, filters: TTreeFilters): Promise<TWorkerFilterResult> {
    this.cancelPending();

    if (!root) {
      return Promise.resolve({
        data: null,
        filterTime: 0,
      });
    }

    const worker = this.getWorker();
    const id = ++this.requestId;
    this.activeRequestId = id;
    this.fallbackRoot = root;

    return new Promise<TWorkerFilterResult>((resolve, reject) => {
      this.resolvePending = resolve;
      this.rejectPending = reject;
      worker.postMessage({ id, root, filters });
    });
  }

  public cancelPending() {
    const hadPending = Boolean(this.rejectPending);
    if (this.rejectPending) {
      this.rejectPending(new FilterCancelledError());
    }
    this.cleanupPending();

    if (hadPending) {
      this.terminateWorker();
    }
  }

  private getWorker() {
    if (this.worker) return this.worker;

    this.worker = new Worker(new URL('../../workers/filter.worker.ts', import.meta.url), {
      type: 'module',
    });

    this.worker.onmessage = (event: MessageEvent<TWorkerFilterResult>) => {
      const result = event.data;
      if (result.id !== this.activeRequestId) return;

      const resolve = this.resolvePending;
      this.cleanupPending();
      resolve?.(result);
    };

    this.worker.onerror = () => {
      const resolve = this.resolvePending;
      const id = this.activeRequestId;
      const fallbackRoot = this.fallbackRoot;
      this.cleanupPending();
      this.terminateWorker();
      resolve?.({
        id,
        data: fallbackRoot,
        filterTime: 0,
      });
    };

    return this.worker;
  }

  private cleanupPending() {
    this.activeRequestId = 0;
    this.resolvePending = null;
    this.rejectPending = null;
    this.fallbackRoot = null;
  }

  private terminateWorker() {
    this.worker?.terminate();
    this.worker = null;
  }
}
