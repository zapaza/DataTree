export type TPathFormat = 'js' | 'jsonpath' | 'xpath';

export default class PathUtils {
  public static getNodePath(path: string, format: TPathFormat): string {
    if (!path) return '';

    const parts = path.split('.');

    // Удаляем 'root' если он есть в начале
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

  private static toJsPath(parts: string[]): string {
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return part;
      }
      return index === 0 ? part : `.${part}`;
    }).join('');
  }

  private static toJsonPath(parts: string[]): string {
    const path = parts.map(part => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return part;
      }
      return `.${part}`;
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
      return part;
    }).join('/');
  }

  public static formatValue(value: any, type: string): string {
    if (value === null) return 'null';
    if (type === 'string') return String(value);
    if (type === 'object' || type === 'array') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }
}
