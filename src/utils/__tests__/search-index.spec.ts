import { describe, it, expect } from 'vitest';
import { SearchIndex } from '../search-index';
import type { TTreeNode } from '@/types/store';

describe('SearchIndex', () => {
  const tree: TTreeNode = {
    type: 'object',
    key: 'root',
    value: null,
    children: [
      {
        type: 'string',
        key: 'name',
        value: 'John Doe'
      },
      {
        type: 'number',
        key: 'age',
        value: 30
      },
      {
        type: 'object',
        key: 'address',
        value: null,
        children: [
          {
            type: 'string',
            key: 'city',
            value: 'New York'
          }
        ]
      },
      {
        type: 'array',
        key: 'tags',
        value: null,
        children: [
          {
            type: 'string',
            key: '[0]',
            value: 'developer'
          }
        ]
      }
    ]
  };

  it('should find matches in keys', () => {
    const results = SearchIndex.search(tree, 'address');
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe('root.address');
    expect(results[0].keyMatch).toBe(true);
  });

  it('should find matches in values', () => {
    const results = SearchIndex.search(tree, 'John');
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe('root.name');
    expect(results[0].valueMatch).toBe(true);
  });

  it('should be case-insensitive', () => {
    const results = SearchIndex.search(tree, 'NEW YORK');
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe('root.address.city');
  });

  it('should find multiple matches', () => {
    const results = SearchIndex.search(tree, 'e'); // name, age (value?), address, city, developer
    // root (key doesn't contain e)
    // root.name (key 'name' contains 'e', value 'John Doe' contains 'e')
    // root.age (key 'age' contains 'e')
    // root.address (key 'address' contains 'e')
    // root.address.city (key 'city' no, value 'New York' yes)
    // root.tags (key 'tags' no)
    // root.tags.[0] (value 'developer' yes)

    const paths = results.map(r => r.path);
    expect(paths).toContain('root.name');
    expect(paths).toContain('root.age');
    expect(paths).toContain('root.address');
    expect(paths).toContain('root.address.city');
    expect(paths).toContain('root.tags.[0]');
  });

  it('should return empty array for no matches', () => {
    const results = SearchIndex.search(tree, 'nonexistent');
    expect(results).toHaveLength(0);
  });
});
