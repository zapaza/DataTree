import { JsonErrorHandler, type ParseResult } from '@/utils/parsers/json-error-handler';
import type { JsonValue } from '@/types/json';

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
      const data = JSON.parse(json) as JsonValue;
      return { success: true, data };
    } catch (e: unknown) {
      return {
        success: false,
        error: JsonErrorHandler.analyzeError(e instanceof Error ? e : new Error('Invalid JSON'), json)
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
    if (this.canParse(fixed)) return fixed;

    fixed = this.normalizeKeysAndDelimiters(fixed);
    fixed = this.closeDanglingStrings(fixed);
    fixed = this.removeTrailingCommas(fixed);
    fixed = this.balanceBrackets(fixed);
    fixed = this.removeTrailingCommas(fixed);

    return fixed;
  }

  private static canParse(json: string): boolean {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  }

  private static lastSignificantChar(output: string): string {
    for (let i = output.length - 1; i >= 0; i--) {
      const char = output[i];
      if (char && !/\s/.test(char)) return char;
    }
    return '';
  }

  private static readIdentifier(input: string, start: number): { value: string; end: number } {
    let end = start;
    while (end < input.length && /[\w$]/.test(input[end] ?? '')) {
      end++;
    }
    return { value: input.slice(start, end), end };
  }

  private static findNextSignificant(input: string, start: number): { char: string; index: number } {
    let index = start;
    while (index < input.length && /\s/.test(input[index] ?? '')) {
      index++;
    }
    return { char: input[index] ?? '', index };
  }

  private static normalizeKeysAndDelimiters(input: string): string {
    let output = '';
    let index = 0;
    let inString = false;
    let escaped = false;

    while (index < input.length) {
      const char = input[index] ?? '';

      if (inString) {
        output += char;
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        index++;
        continue;
      }

      if (char === '"') {
        output += char;
        inString = true;
        index++;
        continue;
      }

      const previous = this.lastSignificantChar(output);
      const canStartKey = previous === '{' || previous === ',';

      if (canStartKey && /[A-Za-z_$]/.test(char)) {
        const identifier = this.readIdentifier(input, index);
        const next = this.findNextSignificant(input, identifier.end);
        if (next.char === ':') {
          output += `"${identifier.value}"`;
          index = identifier.end;
          continue;
        }
      }

      if (canStartKey && char === "'") {
        let end = index + 1;
        let key = '';
        let keyEscaped = false;
        while (end < input.length) {
          const current = input[end] ?? '';
          if (keyEscaped) {
            key += current;
            keyEscaped = false;
          } else if (current === '\\') {
            keyEscaped = true;
          } else if (current === "'") {
            break;
          } else {
            key += current;
          }
          end++;
        }

        const next = this.findNextSignificant(input, end + 1);
        if (end < input.length && next.char === ':') {
          output += JSON.stringify(key);
          index = end + 1;
          continue;
        }
      }

      output += char === ';' ? ',' : char;
      index++;
    }

    return output;
  }

  private static closeDanglingStrings(input: string): string {
    let output = '';
    let inString = false;
    let escaped = false;

    for (let index = 0; index < input.length; index++) {
      const char = input[index] ?? '';

      if (!inString) {
        output += char;
        if (char === '"') {
          inString = true;
          escaped = false;
        }
        continue;
      }

      if (escaped) {
        output += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        output += char;
        escaped = true;
        continue;
      }

      if (char === '"') {
        output += char;
        inString = false;
        continue;
      }

      if (char === '\n') {
        output = output.replace(/,(\s*)$/, '"$1,');
        if (!output.endsWith(',')) output += '"';
        output += char;
        inString = false;
        continue;
      }

      if ((char === '}' || char === ']') && input.slice(index + 1).trim() === '') {
        output += `"${char}`;
        inString = false;
        continue;
      }

      output += char;
    }

    if (inString) output += '"';

    return output;
  }

  private static removeTrailingCommas(input: string): string {
    let output = '';
    let inString = false;
    let escaped = false;

    for (let index = 0; index < input.length; index++) {
      const char = input[index] ?? '';

      if (inString) {
        output += char;
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }

      if (char === '"') {
        output += char;
        inString = true;
        continue;
      }

      if (char === ',') {
        const next = this.findNextSignificant(input, index + 1);
        if (next.char === '}' || next.char === ']') continue;
      }

      output += char;
    }

    return output;
  }

  private static balanceBrackets(input: string): string {
    let result = '';
    const stack: ('}' | ']')[] = [];
    let inString = false;
    let escaped = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

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

    return result;
  }
}
