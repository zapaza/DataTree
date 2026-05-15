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

    expect(result.stats.modified).toBe(1);
    expect(result.stats.unchanged).toBe(2);
    expect(result.patch).toContainEqual({ op: 'replace', path: '/1', value: 4 });
  });

  it('should handle array comparison without order', () => {
    const a = [1, 2, 3];
    const b = [3, 2, 1];
    const result = diffJson(a, b, { arrayOrderMatters: false });

    expect(result.stats.unchanged).toBe(3);
    expect(result.stats.added).toBe(0);
    expect(result.stats.removed).toBe(0);
  });

  it('should ignore configured keys and volatile fields', () => {
    const a = { id: 1, timestamp: '2024-01-01T00:00:00Z', debug: true };
    const b = { id: 1, timestamp: '2025-01-01T00:00:00Z', debug: false };
    const result = diffJson(a, b, {
      ignoreKeys: ['debug'],
      ignoreVolatileFields: true,
      volatileKeys: ['timestamp'],
    });

    expect(result.stats.modified).toBe(0);
    expect(result.changes.every(change => change.type === 'unchanged')).toBe(true);
  });

  it('should compare arrays by stable object key', () => {
    const a = { users: [{ id: 1, name: 'Ann' }, { id: 2, name: 'Bob' }] };
    const b = { users: [{ id: 2, name: 'Bobby' }, { id: 1, name: 'Ann' }] };
    const result = diffJson(a, b, { compareArrayByKey: 'id' });

    expect(result.stats.modified).toBe(1);
    expect(result.changes.find(change => change.displayPath === '/users[id=2]/name')).toMatchObject({
      type: 'modified',
      oldValue: 'Bob',
      newValue: 'Bobby',
    });
  });

  it('should normalize dates and ignore type-only differences', () => {
    const a = { id: '1', createdAt: '2024-01-01T00:00:00.000Z' };
    const b = { id: 1, createdAt: '2024-01-01' };
    const result = diffJson(a, b, { ignoreTypeDiff: true, normalizeDates: true });

    expect(result.stats.modified).toBe(0);
  });

  it('should classify removed fields and type changes as breaking', () => {
    const result = diffJson({ id: '1', name: 'Ada' }, { id: 1 });

    expect(result.riskSummary.breaking).toBe(2);
    expect(result.changes.find(change => change.path === '/name')).toMatchObject({ risk: 'breaking' });
    expect(result.changes.find(change => change.path === '/id')).toMatchObject({ risk: 'breaking' });
  });
});
