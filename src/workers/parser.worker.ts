import type { TDataType } from '@/types/editor';
import { parseDocumentToTree } from '@/utils/document-pipeline';

type TParseWorkerRequest = {
  id: number;
  input: string;
  format: TDataType;
};

self.onmessage = (e: MessageEvent<TParseWorkerRequest>) => {
  const { id, input, format } = e.data;

  const result = parseDocumentToTree(input, format);

  if (result.success) {
    self.postMessage({
      id,
      success: true,
      data: result.tree,
      parseTime: result.parseTime,
      statistics: result.statistics,
    });
  } else {
    self.postMessage({
      id,
      success: false,
      error: result.error,
      parseTime: result.parseTime,
      statistics: result.statistics,
    });
  }
};
