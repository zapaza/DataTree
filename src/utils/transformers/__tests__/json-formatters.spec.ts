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

  it('should sort object keys alphabetically', () => {
    const json = '{"z": 1, "a": 2, "m": 3}';
    const sorted = JsonFormatter.sortKeys(json);
    const lines = sorted.split('\n').map(l => l.trim());
    expect(lines[1]).toContain('"a": 2');
    expect(lines[2]).toContain('"m": 3');
    expect(lines[3]).toContain('"z": 1');
  });

  it('should sort nested object keys', () => {
    const json = '{"b": {"y": 1, "x": 2}, "a": 3}';
    const sorted = JsonFormatter.sortKeys(json);
    const parsed = JSON.parse(sorted);
    const keys = Object.keys(parsed);
    expect(keys).toEqual(['a', 'b']);
    const nestedKeys = Object.keys(parsed.b);
    expect(nestedKeys).toEqual(['x', 'y']);
  });
});
