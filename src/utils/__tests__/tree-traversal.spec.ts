import { describe, it, expect } from 'vitest';
import { TreeTraversal } from '../tree-traversal';
import type { TTreeNode } from '@/types/store';

describe('TreeTraversal', () => {
  const mockTree: TTreeNode = {
    type: 'object',
    key: 'root',
    value: null,
    children: [
      {
        type: 'string',
        key: 'name',
        value: 'John',
      },
      {
        type: 'object',
        key: 'address',
        value: null,
        children: [
          {
            type: 'string',
            key: 'city',
            value: 'New York',
          }
        ]
      }
    ]
  };

  it('should return only root when no nodes are expanded', () => {
    const expanded = new Set<string>();
    const visible = TreeTraversal.getVisibleNodes(mockTree, expanded);

    expect(visible).toHaveLength(1);
    expect(visible[0].path).toBe('root');
  });

  it('should return children when root is expanded', () => {
    const expanded = new Set(['root']);
    const visible = TreeTraversal.getVisibleNodes(mockTree, expanded);

    expect(visible).toHaveLength(3); // root, name, address
    expect(visible.map(v => v.path)).toEqual(['root', 'root.name', 'root.address']);
  });

  it('should return nested children when parent is expanded', () => {
    const expanded = new Set(['root', 'root.address']);
    const visible = TreeTraversal.getVisibleNodes(mockTree, expanded);

    expect(visible).toHaveLength(4); // root, name, address, address.city
    expect(visible.map(v => v.path)).toEqual(['root', 'root.name', 'root.address', 'root.address.city']);
  });

  it('should handle null root', () => {
    const visible = TreeTraversal.getVisibleNodes(null, new Set());
    expect(visible).toEqual([]);
  });
});
