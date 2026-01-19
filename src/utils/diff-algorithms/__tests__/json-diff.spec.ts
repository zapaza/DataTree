import { describe, it, expect } from 'vitest';
import { diffJson } from '../json-diff';

describe('json-diff', () => {
  it('should detect added properties', () => {
    const a = { x: 1 };
    const b = { x: 1, y: 2 };
    const result = diffJson(a, b);

    expect(result.stats.added).toBe(1);
    expect(result.changes.find(c => c.path === '/y' && c.type === 'added')).toBeDefined();
    expect(result.patch).toContainEqual({ op: 'add', path: '/y', value: 2 });
  });

  it('should detect removed properties', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 1 };
    const result = diffJson(a, b);

    expect(result.stats.removed).toBe(1);
    expect(result.changes.find(c => c.path === '/y' && c.type === 'removed')).toBeDefined();
    expect(result.patch).toContainEqual({ op: 'remove', path: '/y' });
  });

  it('should detect modified properties', () => {
    const a = { x: 1 };
    const b = { x: 2 };
    const result = diffJson(a, b);

    expect(result.stats.modified).toBe(1);
    expect(result.changes.find(c => c.path === '/x' && c.type === 'modified')).toBeDefined();
    expect(result.patch).toContainEqual({ op: 'replace', path: '/x', value: 2 });
  });

  it('should handle deep objects', () => {
    const a = { nested: { a: 1 } };
    const b = { nested: { a: 2 } };
    const result = diffJson(a, b);

    expect(result.stats.modified).toBe(1);
    expect(result.changes.find(c => c.path === '/nested/a' && c.type === 'modified')).toBeDefined();
  });

  it('should compare arrays with LCS (ordered)', () => {
    const a = [1, 2, 3];
    const b = [1, 4, 3];
    const result = diffJson(a, b);

    // 1 -> unchanged, 2 -> removed, 4 -> added, 3 -> unchanged
    // note: my current impl might treat it as modified if I don't use LCS correctly for replacement
    // actually LCS says 1, 3 are unchanged. 2 is removed, 4 is added.
    expect(result.stats.removed).toBe(1);
    expect(result.stats.added).toBe(1);
    expect(result.stats.unchanged).toBe(2);
  });

  it('should handle array comparison without order', () => {
    const a = [1, 2, 3];
    const b = [3, 2, 1];
    const result = diffJson(a, b, { arrayOrderMatters: false });

    expect(result.stats.unchanged).toBe(3);
    expect(result.stats.added).toBe(0);
    expect(result.stats.removed).toBe(0);
  });
});
