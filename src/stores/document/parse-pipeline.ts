import type { TDataType } from '@/types/editor';
import type { TDocumentStatistics, TParseError, TTreeNode } from '@/types/store';
import { createDocumentStatistics } from '@/utils/statistics';

export type TWorkerParseResult =
  | {
      id?: number;
      success: true;
      data: TTreeNode | null;
      parseTime: number;
      statistics: TDocumentStatistics;
    }
  | {
      id?: number;
      success: false;
      error: TParseError | null;
      parseTime: number;
      statistics: TDocumentStatistics;
    };

export class ParseCancelledError extends Error {
  constructor() {
    super('Parse cancelled');
    this.name = 'ParseCancelledError';
  }
}

export const isParseCancelledError = (error: unknown): error is ParseCancelledError => {
  return error instanceof ParseCancelledError;
};

export class DocumentParsePipeline {
  private worker: Worker | null = null;
  private requestId = 0;
  private activeRequestId = 0;
  private activeInputLength = 0;
  private activeFormat: TDataType = 'json';
  private resolvePending: ((result: TWorkerParseResult) => void) | null = null;
  private rejectPending: ((error: ParseCancelledError) => void) | null = null;

  public parse(input: string, format: TDataType): Promise<TWorkerParseResult> {
    this.cancelPending();

    if (!input.trim()) {
      return Promise.resolve({
        success: true,
        data: null,
        parseTime: 0,
        statistics: createDocumentStatistics(null, input.length, format, true, 0),
      });
    }

    const worker = this.getWorker();
    const id = ++this.requestId;
    this.activeRequestId = id;
    this.activeInputLength = input.length;
    this.activeFormat = format;

    return new Promise<TWorkerParseResult>((resolve, reject) => {
      this.resolvePending = resolve;
      this.rejectPending = reject;
      worker.postMessage({ id, input, format });
    });
  }

  public cancelPending() {
    const hadPending = Boolean(this.rejectPending);
    if (this.rejectPending) {
      this.rejectPending(new ParseCancelledError());
    }
    this.cleanupPending();

    if (hadPending) {
      this.terminateWorker();
    }
  }

  private getWorker() {
    if (this.worker) return this.worker;

    this.worker = new Worker(new URL('../../workers/parser.worker.ts', import.meta.url), {
      type: 'module',
    });

    this.worker.onmessage = (event: MessageEvent<TWorkerParseResult>) => {
      const result = event.data;
      if (result.id !== this.activeRequestId) return;

      const resolve = this.resolvePending;
      this.cleanupPending();
      resolve?.(result);
    };

    this.worker.onerror = () => {
      const resolve = this.resolvePending;
      const id = this.activeRequestId;
      const inputLength = this.activeInputLength;
      const format = this.activeFormat;
      this.cleanupPending();
      this.terminateWorker();
      resolve?.({
        id,
        success: false,
        error: {
          message: 'Parsing worker error',
          line: 1,
          column: 1,
          severity: 'error',
        },
        parseTime: 0,
        statistics: createDocumentStatistics(null, inputLength, format, false, 0),
      });
    };

    return this.worker;
  }

  private cleanupPending() {
    this.activeRequestId = 0;
    this.activeInputLength = 0;
    this.resolvePending = null;
    this.rejectPending = null;
  }

  private terminateWorker() {
    this.worker?.terminate();
    this.worker = null;
  }
}
