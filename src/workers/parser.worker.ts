import SafeJsonParser from '@/utils/parsers/json-parser';
import XmlParser from '@/utils/parsers/xml-parser';
import XmlToJsonConverter from '@/utils/parsers/xml-to-json';
import TreeTransformer from '@/utils/tree-transformer';
import type { TDataType } from '@/types/editor';

self.onmessage = (e: MessageEvent) => {
  const { input, format }: { input: string, format: TDataType } = e.data;

  const startTime = performance.now();
  let transformedData: any = null;
  let error: any = null;

  if (format === 'json') {
    const result = SafeJsonParser.parse(input);
    if (result.success) {
      transformedData = TreeTransformer.transform(result.data);
    } else {
      error = result.error;
    }
  } else {
    const result = XmlParser.parse(input);
    if (result.success) {
      transformedData = XmlToJsonConverter.convert(result.data);
    } else {
      error = result.error;
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
