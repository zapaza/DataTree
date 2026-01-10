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
    let fixed = json.trim();
    if (!fixed) return json;

    // 1. Пропущенные кавычки у ключей
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g, '$1"$2"$3');
    fixed = fixed.replace(/([{,]\s*)'([a-zA-Z0-9_$]+)'(\s*:)/g, '$1"$2"$3');

    // 2. Исправление незакрытых кавычек (построчно)
    // Это помогает корректно обрабатывать кавычки перед структурными символами
    const lines = fixed.split('\n');
    const fixedLines = lines.map(line => {
      const trimmed = line.trim();
      const quoteCount = (line.match(/"/g) || []).length;

      if (quoteCount % 2 !== 0) {
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

    // 3. Глобальный проход для скобок и точек с запятой
    let result = '';
    const stack: ('}' | ']')[] = [];
    let inString = false;
    let escaped = false;

    for (let i = 0; i < fixed.length; i++) {
      const char = fixed[i];

      if (inString) {
        if (escaped) {
          result += char;
          escaped = false;
        } else if (char === '\\') {
          result += char;
          escaped = true;
        } else if (char === '"') {
          result += char;
          inString = false;
        } else {
          result += char;
        }
        continue;
      }

      if (char === '"') {
        result += char;
        inString = true;
        continue;
      }

      if (char === '{') {
        stack.push('}');
        result += char;
      } else if (char === '[') {
        stack.push(']');
        result += char;
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '}') {
          stack.pop();
        }
        result += char;
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === ']') {
          stack.pop();
        }
        result += char;
      } else if (char === ';') {
        result += ','; // Исправляем ; на ,
      } else {
        result += char;
      }
    }

    if (inString) {
      result += '"';
    }

    // Добавляем недостающие закрывающие скобки
    while (stack.length > 0) {
      result += stack.pop();
    }

    // 4. Удаляем лишние запятые перед закрывающими скобками
    result = result.replace(/,\s*([\]}])/g, '$1');

    return result;
  }
}
