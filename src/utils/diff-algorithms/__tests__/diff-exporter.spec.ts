import { describe, it, expect } from 'vitest';
import DiffExporter from '../diff-exporter';
import type { TDiffResult } from '@/types/diff';

describe('DiffExporter', () => {
  const mockDiffResult: TDiffResult = {
    changes: [
      { type: 'added', path: '/foo', newValue: 'bar' },
      { type: 'removed', path: '/old', oldValue: 123 },
      { type: 'modified', path: '/obj', oldValue: { a: 1 }, newValue: { a: 2 } },
      { type: 'unchanged', path: '/same' }
    ],
    stats: {
      added: 1,
      removed: 1,
      modified: 1,
      unchanged: 1
    },
    patch: [
      { op: 'add', path: '/foo', value: 'bar' },
      { op: 'remove', path: '/old' },
      { op: 'replace', path: '/obj', value: { a: 2 } }
    ]
  };

  it('should generate valid JSON Patch', () => {
    const result = DiffExporter.toJSONPatch(mockDiffResult);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(mockDiffResult.patch);
    expect(result).toContain('"op": "add"');
  });

  it('should generate valid CSV', () => {
    const result = DiffExporter.toCSV(mockDiffResult);
    const lines = result.split('\n');
    expect(lines[0]).toBe('Path,Type,Old Value,New Value');
    expect(lines[1]).toContain('"/foo","added","","bar"');
    expect(lines[2]).toContain('"/old","removed","123",""');
    // Check that unchanged items are excluded
    expect(result).not.toContain('"/same"');
  });

  it('should generate HTML report containing stats and changes', () => {
    const result = DiffExporter.toHTMLReport(mockDiffResult);
    expect(result).toContain('<h1>JSON Diff Report</h1>');
    expect(result).toContain('Added: 1');
    expect(result).toContain('Removed: 1');
    expect(result).toContain('Modified: 1');
    expect(result).toContain('/foo');
    expect(result).toContain('/old');
    expect(result).toContain('/obj');
  });

  it('should generate a basic unified diff header', () => {
    const left = '{"a": 1}';
    const right = '{"a": 2}';
    const result = DiffExporter.toUnifiedDiff(left, right, 'test.json');
    expect(result).toContain('--- a/test.json');
    expect(result).toContain('+++ b/test.json');
    expect(result).toContain('-  "a": 1');
    expect(result).toContain('+  "a": 2');
  });
});
