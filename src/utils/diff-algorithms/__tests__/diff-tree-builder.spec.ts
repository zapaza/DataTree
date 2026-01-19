import { describe, it, expect } from 'vitest';
import { buildDiffTree } from '../diff-tree-builder';

describe('buildDiffTree', () => {
  it('should detect unchanged values', () => {
    const left = { a: 1 };
    const right = { a: 1 };
    const tree = buildDiffTree(left, right);

    expect(tree.diffType).toBe('unchanged');
    expect(tree.children?.[0].diffType).toBe('unchanged');
    expect(tree.children?.[0].key).toBe('a');
  });

  it('should detect added values', () => {
    const left = { a: 1 };
    const right = { a: 1, b: 2 };
    const tree = buildDiffTree(left, right);

    expect(tree.diffType).toBe('modified');
    expect(tree.children?.find(c => c.key === 'b')?.diffType).toBe('added');
  });

  it('should detect removed values', () => {
    const left = { a: 1, b: 2 };
    const right = { a: 1 };
    const tree = buildDiffTree(left, right);

    expect(tree.diffType).toBe('modified');
    expect(tree.children?.find(c => c.key === 'b')?.diffType).toBe('removed');
  });

  it('should detect modified values', () => {
    const left = { a: 1 };
    const right = { a: 2 };
    const tree = buildDiffTree(left, right);

    expect(tree.diffType).toBe('modified');
    expect(tree.children?.[0].diffType).toBe('modified');
    expect(tree.children?.[0].oldValue).toBe(1);
    expect(tree.children?.[0].newValue).toBe(2);
  });

  it('should handle nested objects', () => {
    const left = { a: { b: 1 } };
    const right = { a: { b: 2 } };
    const tree = buildDiffTree(left, right);

    expect(tree.diffType).toBe('modified');
    const nodeA = tree.children?.[0];
    expect(nodeA?.diffType).toBe('modified');
    expect(nodeA?.children?.[0].diffType).toBe('modified');
    expect(nodeA?.children?.[0].key).toBe('b');
  });
});
