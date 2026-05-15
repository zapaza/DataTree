import type { TTreeFilters, TTreeNode } from '@/types/store';
import TreeFilter from '@/utils/tree-filter';

type TFilterWorkerRequest = {
  id: number;
  root: TTreeNode | null;
  filters: TTreeFilters;
};

self.onmessage = (event: MessageEvent<TFilterWorkerRequest>) => {
  const { id, root, filters } = event.data;
  const start = performance.now();

  self.postMessage({
    id,
    data: root ? TreeFilter.filter(root, filters) : null,
    filterTime: performance.now() - start,
  });
};
