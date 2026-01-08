import type { TParseError } from '@/types/store';
import SafeJsonParser from '@/utils/parsers/json-parser';

export default class ErrorFormatter {
  public static enhance(error: TParseError, content: string, format: 'json' | 'xml'): TParseError {
    const enhanced = { ...error };

    if (format === 'json') {
      this.enhanceJsonError(enhanced, content);
    } else {
      this.enhanceXmlError(enhanced, content);
    }

    return enhanced;
  }

  private static enhanceJsonError(error: TParseError, content: string) {
    const msg = error.message.toLowerCase();

    if (msg.includes('unexpected token') && msg.includes('in json at position')) {
      // Пытаемся понять, что не так
      if (content.includes(',\n') || content.includes(',\r\n') || content.includes(',}')) {
        error.suggestion = {
          label: 'Remove trailing comma',
          fix: () => SafeJsonParser.fix(content)
        };
      }
    } else if (msg.includes('expected property name') || msg.includes('unexpected token')) {
      // Возможно пропущены кавычки
      if (/[{,]\s*[a-zA-Z0-9_$]+\s*:/.test(content)) {
        error.suggestion = {
          label: 'Add quotes to keys',
          fix: () => SafeJsonParser.fix(content)
        };
      }
    }

    // Если SafeJsonParser.fix меняет строку, значит мы можем предложить исправление
    const fixed = SafeJsonParser.fix(content);
    if (fixed !== content && !error.suggestion) {
      error.suggestion = {
        label: 'Auto-fix common errors',
        fix: () => fixed
      };
    }
  }

  private static enhanceXmlError(error: TParseError, content: string) {
    const msg = error.message.toLowerCase();

    if (msg.includes('closing tag') && msg.includes('expected')) {
      error.message = error.message.replace('Expected', 'Ожидался закрывающий тег');
    }

    // Для XML автоисправление сложнее реализовать без полноценного парсера
  }
}
