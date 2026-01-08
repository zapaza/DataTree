import { JsonErrorHandler, type ParseResult } from '@/utils/parsers/json-error-handler';

/**
 * Utility class for safe JSON parsing with error analysis and auto-fix capabilities.
 */
export default class SafeJsonParser {
  /**
   * Attempts to parse a JSON string safely.
   * @param json - The JSON string to parse.
   * @returns A result object containing either the parsed data or detailed error information.
   */
  public static parse(json: string): ParseResult {
    const trimmed = json.trim();
    if (!trimmed) {
      return { success: true, data: null };
    }

    try {
      const data = JSON.parse(json);
      return { success: true, data };
    } catch (e: any) {
      return {
        success: false,
        error: JsonErrorHandler.analyzeError(e, json)
      };
    }
  }

  /**
   * Attempts to automatically fix common JSON errors (trailing commas, unquoted keys, etc.).
   * @param json - The potentially invalid JSON string.
   * @returns A fixed version of the JSON string.
   */
  public static fix(json: string): string {
    let fixed = json;

    // 1. Лишние запятые (trailing commas)
    fixed = fixed.replace(/,\s*([\]}])/g, '$1');

    // 2. Пропущенные кавычки у ключей
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g, '$1"$2"$3');

    // 3. Одинарные кавычки -> Двойные кавычки (только для ключей и простых строковых значений)
    // Осторожно: может затронуть содержимое строк, если внутри есть одинарные кавычки
    // fixed = fixed.replace(/'([^']*)'/g, '"$1"');

    // 4. Незакрытые кавычки в конце строки или перед закрывающими символами
    const lines = fixed.split('\n');
    const fixedLines = lines.map(line => {
      const trimmed = line.trim();
      const quoteCount = (line.match(/"/g) || []).length;

      if (quoteCount % 2 !== 0) {
        // Если строка заканчивается на , ] } то вставляем кавычку перед ними
        if (trimmed.endsWith(',')) {
          return line.replace(/,(\s*)$/, '"$1,');
        } else if (trimmed.endsWith('}')) {
          return line.replace(/\}(\s*)$/, '"}$1');
        } else if (trimmed.endsWith(']')) {
          return line.replace(/\](\s*)$/, '"]$1');
        } else if (!trimmed.endsWith('{') && !trimmed.endsWith('[')) {
          return line + '"';
        }
      }
      return line;
    });
    fixed = fixedLines.join('\n');

    return fixed;
  }
}
