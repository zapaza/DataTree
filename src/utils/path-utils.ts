import type { JsonValue } from '@/types/json';

export type TPathFormat = 'js' | 'jsonpath' | 'xpath';

export default class PathUtils {
  public static getNodePath(path: string | string[], format: TPathFormat): string {
    const parts = Array.isArray(path) ? [...path] : this.pathStringToParts(path);

    if (parts[0] === 'root') {
      parts.shift();
    }

    if (parts.length === 0) {
      return format === 'jsonpath' ? '$' : (format === 'xpath' ? '/' : '');
    }

    switch (format) {
      case 'js':
        return this.toJsPath(parts);
      case 'jsonpath':
        return this.toJsonPath(parts);
      case 'xpath':
        return this.toXPath(parts);
      default:
        return parts.join('.');
    }
  }

  private static pathStringToParts(path: string): string[] {
    if (!path) return [];
    return path.split('.');
  }

  private static isArrayIndex(part: string): boolean {
    return /^\[\d+\]$/.test(part);
  }

  private static isSafeJsIdentifier(part: string): boolean {
    return /^[$A-Z_a-z][$\w]*$/.test(part);
  }

  private static isSafeJsonPathKey(part: string): boolean {
    return /^[A-Z_a-z][$\w]*$/.test(part);
  }

  private static isSafeXPathName(part: string): boolean {
    return /^[A-Za-z_][\w.-]*$/.test(part);
  }

  private static quoteJsonPathKey(part: string): string {
    return `['${part.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}']`;
  }

  private static toXPathLiteral(value: string): string {
    if (!value.includes('"')) return `"${value}"`;
    if (!value.includes("'")) return `'${value}'`;

    const pieces = value.split('"').map(piece => `"${piece}"`);
    return `concat(${pieces.join(', \'"\', ')})`;
  }

  private static toJsPath(parts: string[]): string {
    return parts.map((part, index) => {
      if (this.isArrayIndex(part)) {
        return part;
      }
      if (this.isSafeJsIdentifier(part)) {
        return index === 0 ? part : `.${part}`;
      }
      return `[${JSON.stringify(part)}]`;
    }).join('');
  }

  private static toJsonPath(parts: string[]): string {
    const path = parts.map(part => {
      if (this.isArrayIndex(part)) {
        return part;
      }
      if (this.isSafeJsonPathKey(part)) {
        return `.${part}`;
      }
      return this.quoteJsonPathKey(part);
    }).join('');
    return '$' + path;
  }

  private static toXPath(parts: string[]): string {
    return '/' + parts.map(part => {
      const arrayMatch = part.match(/^\[(\d+)\]$/);
      if (arrayMatch && arrayMatch[1]) {
        // XPath индексы начинаются с 1
        const index = parseInt(arrayMatch[1], 10) + 1;
        return `*[${index}]`;
      }
      if (!this.isSafeXPathName(part)) {
        return `*[name()=${this.toXPathLiteral(part)}]`;
      }
      return part;
    }).join('/');
  }

  public static formatValue(value: JsonValue, type: string): string {
    if (value === null) return 'null';
    if (type === 'string') return String(value);
    if (type === 'object' || type === 'array') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }
}
