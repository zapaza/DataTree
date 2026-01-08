import { describe, it, expect } from 'vitest';
import JsonFormatter from '../json-formatters';

describe('JsonFormatter', () => {
  it('should format JSON', () => {
    const json = '{"a":1,"b":2}';
    const formatted = JsonFormatter.format(json);
    expect(formatted).toContain('\n  "a": 1');
  });

  it('should minify JSON', () => {
    const json = `{
      "a": 1,
      "b": 2
    }`;
    const minified = JsonFormatter.minify(json);
    expect(minified).toBe('{"a":1,"b":2}');
  });
});
