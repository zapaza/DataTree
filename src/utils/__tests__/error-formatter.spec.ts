import { describe, it, expect } from 'vitest';
import ErrorFormatter from '../error-formatter';
import type { TParseError } from '@/types/store';

describe('ErrorFormatter', () => {
  it('should add suggestion for trailing comma in JSON', () => {
    const error: TParseError = {
      message: 'Unexpected token } in JSON at position 15',
      line: 2,
      column: 5,
      severity: 'error'
    };
    const content = '{\n  "a": 1,\n}';
    const enhanced = ErrorFormatter.enhance(error, content, 'json');

    expect(enhanced.suggestion).toBeDefined();
    expect(enhanced.suggestion?.label).toBe('Remove trailing comma');
  });

  it('should add suggestion for missing quotes in JSON', () => {
    const error: TParseError = {
      message: 'Expected property name or } in JSON at position 2',
      line: 1,
      column: 2,
      severity: 'error'
    };
    const content = '{ name: "John" }';
    const enhanced = ErrorFormatter.enhance(error, content, 'json');

    expect(enhanced.suggestion).toBeDefined();
    expect(enhanced.suggestion?.label).toBe('Add quotes to keys');
  });

  it('should translate XML error messages', () => {
    const error: TParseError = {
      message: 'Expected closing tag for <root>',
      line: 1,
      column: 10,
      severity: 'error'
    };
    const content = '<root><item></root>';
    const enhanced = ErrorFormatter.enhance(error, content, 'xml');

    expect(enhanced.message).toContain('Ожидался закрывающий тег');
  });

  it('should return original error if no enhancements available', () => {
    const error: TParseError = {
      message: 'Random error',
      line: 1,
      column: 1,
      severity: 'error'
    };
    const content = 'random content';
    const enhanced = ErrorFormatter.enhance(error, content, 'json');

    expect(enhanced.message).toBe(error.message);
  });
});
