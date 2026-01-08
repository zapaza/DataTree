import SafeJsonParser from '@/utils/parsers/json-parser';
import XmlParser from '@/utils/parsers/xml-parser';
import TreeTransformer from '@/utils/tree-transformer';
import type { TDataType } from '@/types/editor';

self.onmessage = (e: MessageEvent) => {
  const { input, format }: { input: string, format: TDataType } = e.data;

  const startTime = performance.now();
  const result = format === 'json'
    ? SafeJsonParser.parse(input)
    : XmlParser.parse(input);

  const endTime = performance.now();
  const parseTime = Number((endTime - startTime).toFixed(2));

  if (result.success) {
    const transformedData = TreeTransformer.transform(result.data);
    self.postMessage({
      success: true,
      data: transformedData,
      parseTime
    });
  } else {
    self.postMessage({
      success: false,
      error: result.error,
      parseTime
    });
  }
};
