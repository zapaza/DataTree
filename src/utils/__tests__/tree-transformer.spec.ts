import { describe, it, expect } from 'vitest';
import TreeTransformer from '../tree-transformer';
import type { TTreeNode } from '@/types/store';

describe('TreeTransformer', () => {
  it('should transform a simple object', () => {
    const data = { name: 'John', age: 30 };
    const tree = TreeTransformer.transform(data);

    expect(tree.type).toBe('object');
    expect(tree.key).toBe('root');
    expect(tree.children).toHaveLength(2);

    const nameNode = tree.children?.find(c => c.key === 'name');
    expect(nameNode?.type).toBe('string');
    expect(nameNode?.value).toBe('John');
  });

  it('should transform an array', () => {
    const data = [1, 2, 3];
    const tree = TreeTransformer.transform(data);

    expect(tree.type).toBe('array');
    expect(tree.children).toHaveLength(3);
    expect(tree.children?.[0].key).toBe('[0]');
    expect(tree.children?.[0].value).toBe(1);
  });

  it('should handle null values', () => {
    const data = { a: null };
    const tree = TreeTransformer.transform(data);

    const aNode = tree.children?.[0];
    expect(aNode?.type).toBe('null');
    expect(aNode?.value).toBe(null);
  });

  it('should count nodes correctly', () => {
    const tree: TTreeNode = {
      type: 'object',
      key: 'root',
      value: null,
      children: [
        { type: 'string', key: 'a', value: '1' },
        { type: 'object', key: 'b', value: null, children: [] }
      ]
    };

    expect(TreeTransformer.countNodes(tree)).toBe(3);
    expect(TreeTransformer.countNodes(null)).toBe(0);
  });
});
