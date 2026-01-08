import type { TErrorPosition } from '@/types/editor';

export interface ParseResult {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    line: number;
    column: number;
    snippet: string;
  };
}

export class JsonErrorHandler {
  public static analyzeError(error: Error, text: string) {
    const message = error.message;
    const position = this.extractPosition(message, text);
    const snippet = this.generateSnippet(text, position);

    return {
      message,
      line: position.line,
      column: position.column,
      snippet
    };
  }

  private static extractPosition(message: string, text: string): TErrorPosition {
    // V8: "at position 123"
    const positionMatch = message.match(/at position (\d+)/);
    if (positionMatch && positionMatch[1]) {
      const offset = parseInt(positionMatch[1], 10);
      return this.offsetToPosition(text, offset);
    }

    // Firefox: "at line 1 column 2"
    const lineColMatch = message.match(/at line (\d+) column (\d+)/);
    if (lineColMatch && lineColMatch[1] && lineColMatch[2]) {
      return {
        line: parseInt(lineColMatch[1], 10),
        column: parseInt(lineColMatch[2], 10)
      };
    }

    return { line: 1, column: 1 };
  }

  private static offsetToPosition(text: string, offset: number): TErrorPosition {
    const lines = text.slice(0, offset).split('\n');
    const lastLine = lines[lines.length - 1];
    return {
      line: lines.length,
      column: lastLine ? lastLine.length + 1 : 1
    };
  }

  private static generateSnippet(text: string, position: TErrorPosition): string {
    const lines = text.split('\n');
    const errorLine = lines[position.line - 1] || '';
    const start = Math.max(0, position.column - 20);
    const end = Math.min(errorLine.length, position.column + 20);

    let snippet = errorLine.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < errorLine.length) snippet = snippet + '...';

    return snippet;
  }
}
