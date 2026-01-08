import type { TDataType } from '../types/editor';

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
    const trimmed = content.trim();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return 'json';
    }

    if (trimmed.startsWith('<')) {
      return 'xml';
    }

    return 'json'; // По умолчанию JSON
  };

  return {
    detectFormat
  };
}
