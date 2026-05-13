import SafeJsonParser from '@/utils/parsers/json-parser';
import XmlParser from '@/utils/parsers/xml-parser';
import XmlToJsonConverter from '@/utils/parsers/xml-to-json';
import TreeTransformer from '@/utils/tree-transformer';
import type { TDataType } from '@/types/editor';
import type { TParseError, TTreeNode } from '@/types/store';

self.onmessage = (e: MessageEvent) => {
  const { input, format }: { input: string, format: TDataType } = e.data;

  const startTime = performance.now();
  let transformedData: TTreeNode | null = null;
  let error: TParseError | null = null;

  if (format === 'json') {
    const result = SafeJsonParser.parse(input);
    if (result.success) {
      transformedData = TreeTransformer.transform(result.data ?? null);
    } else {
      error = result.error
        ? { ...result.error, severity: 'error' }
        : null;
    }
  } else {
    const result = XmlParser.parse(input);
    if (result.success) {
      transformedData = XmlToJsonConverter.convert(result.data ?? null);
    } else {
      error = result.error
        ? { ...result.error, severity: 'error' }
        : null;
    }
  }

  const endTime = performance.now();
  const parseTime = Number((endTime - startTime).toFixed(2));

  if (transformedData) {
    self.postMessage({
      success: true,
      data: transformedData,
      parseTime
    });
  } else {
    self.postMessage({
      success: false,
      error,
      parseTime
    });
  }
};
