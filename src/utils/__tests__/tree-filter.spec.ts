import { describe, it, expect } from 'vitest';
import TreeFilter from '../tree-filter';
import type { TTreeNode, TTreeFilters } from '@/types/store';

describe('TreeFilter', () => {
  const mockFilters: TTreeFilters = {
    hideNull: false,
    hideEmptyArrays: false,
    hideEmptyObjects: false,
    hideTypes: [],
    maxDepth: 10
  };

  const sampleTree: TTreeNode = {
    type: 'object',
    key: 'root',
    value: null,
    children: [
      { type: 'string', key: 'name', value: 'John' },
      { type: 'null', key: 'meta', value: null },
      { type: 'object', key: 'emptyObj', value: null, children: [] },
      { type: 'array', key: 'emptyArr', value: null, children: [] },
      {
        type: 'object',
        key: 'nested',
        value: null,
        children: [
          { type: 'number', key: 'age', value: 30 }
        ]
      }
    ]
  };

  it('should return original tree if no filters applied', () => {
    const result = TreeFilter.filter(sampleTree, mockFilters);
    expect(result).toEqual(sampleTree);
  });

  it('should hide null values', () => {
    const result = TreeFilter.filter(sampleTree, { ...mockFilters, hideNull: true });
    expect(result?.children?.find(c => c.type === 'null')).toBeUndefined();
    expect(result?.children).toHaveLength(4);
  });

  it('should hide empty objects', () => {
    const result = TreeFilter.filter(sampleTree, { ...mockFilters, hideEmptyObjects: true });
    expect(result?.children?.find(c => c.key === 'emptyObj')).toBeUndefined();
  });

  it('should hide empty arrays', () => {
    const result = TreeFilter.filter(sampleTree, { ...mockFilters, hideEmptyArrays: true });
    expect(result?.children?.find(c => c.key === 'emptyArr')).toBeUndefined();
  });

  it('should hide by types', () => {
    const result = TreeFilter.filter(sampleTree, { ...mockFilters, hideTypes: ['number', 'string'] });
    expect(result?.children?.find(c => c.type === 'string')).toBeUndefined();
    // nested object becomes empty after hiding number, so if hideEmptyObjects is false, it stays
    const nested = result?.children?.find(c => c.key === 'nested');
    expect(nested?.children).toHaveLength(0);
  });

  it('should hide nested empty objects if hideEmptyObjects is true', () => {
    const result = TreeFilter.filter(sampleTree, {
      ...mockFilters,
      hideTypes: ['number'],
      hideEmptyObjects: true
    });
    expect(result?.children?.find(c => c.key === 'nested')).toBeUndefined();
  });

  it('should respect max depth', () => {
    const result = TreeFilter.filter(sampleTree, { ...mockFilters, maxDepth: 0 });
    // Root is at depth 0, its children are at depth 1.
    // If maxDepth is 0, children should be filtered out.
    expect(result?.children).toHaveLength(0);
  });
});
