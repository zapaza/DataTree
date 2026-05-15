import type { TDataType } from '../types/editor';
import { detectPayloadFormat } from '@/utils/format-detector';

/**
 * Composable for automatically detecting the format (JSON or XML) of a string.
 */
export default function useFormatDetector() {
  /**
   * Heuristically determines if the input string is likely JSON or XML.
   * @param content - The string content to analyze.
   * @returns 'xml' if it starts with '<', otherwise 'json'.
   */
  const detectFormat = (content: string): TDataType => {
    return detectPayloadFormat(content);
  };

  return {
    detectFormat
  };
}
