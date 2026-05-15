import { describe, expect, it } from 'vitest';
import type { TTreeNode } from '@/types/store';
import {
  collectExpandablePaths,
  stringifyTreeNodeAsJson,
  stringifyTreeNodeValue,
  treeNodeToValue,
} from '../tree-node-utils';

const sampleTree: TTreeNode = {
  key: 'root',
  type: 'object',
  value: null,
  children: [
    {
      key: 'users',
      type: 'array',
      value: null,
      children: [
        {
          key: '[0]',
          type: 'object',
          value: null,
          children: [
            { key: 'first.name', type: 'string', value: 'Ada' },
            { key: 'active', type: 'boolean', value: true },
          ],
        },
      ],
    },
    {
      key: 'meta',
      type: 'object',
      value: null,
      children: [
        { key: 'count', type: 'number', value: 1 },
      ],
    },
  ],
};

describe('tree-node-utils', () => {
  it('restores object and array values from tree nodes', () => {
    expect(treeNodeToValue(sampleTree)).toEqual({
      users: [
        {
          'first.name': 'Ada',
          active: true,
        },
      ],
      meta: {
        count: 1,
      },
    });
  });

  it('serializes object values instead of placeholder node.value', () => {
    expect(stringifyTreeNodeValue(sampleTree)).toContain('"first.name": "Ada"');
  });

  it('serializes node metadata with restored value', () => {
    const json = JSON.parse(stringifyTreeNodeAsJson(sampleTree, 'root', []));

    expect(json.type).toBe('object');
    expect(json.value.users[0]['first.name']).toBe('Ada');
  });

  it('collects expandable paths by requested depth', () => {
    expect(collectExpandablePaths(sampleTree, 1)).toEqual(['root']);
    expect(collectExpandablePaths(sampleTree, 2)).toEqual(['root', 'root.users', 'root.meta']);
    expect(collectExpandablePaths(sampleTree, 'all')).toEqual(['root', 'root.users', 'root.users.[0]', 'root.meta']);
  });

  it('restores deeply nested tree values without recursive stack overflow', () => {
    const root: TTreeNode = { key: 'root', type: 'object', value: null, children: [] };
    let cursor = root;
    for (let index = 0; index < 1500; index++) {
      const next: TTreeNode = { key: 'next', type: 'object', value: null, children: [] };
      cursor.children = [next];
      cursor = next;
    }
    cursor.children = [{ key: 'done', type: 'boolean', value: true }];

    const value = treeNodeToValue(root);

    let restored = value;
    for (let index = 0; index < 1500; index++) {
      expect(restored).toHaveProperty('next');
      restored = restored && typeof restored === 'object' && !Array.isArray(restored) ? restored.next : null;
    }
    expect(restored).toEqual({ done: true });
  });
});
