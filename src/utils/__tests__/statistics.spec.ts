import { describe, it, expect } from 'vitest';
import StatisticsCalculator from '../statistics';
import type { TTreeNode } from '@/types/store';

describe('StatisticsCalculator', () => {
  it('should return empty stats if node is null', () => {
    const stats = StatisticsCalculator.calculate(null, 100, 'json', true, 5);
    expect(stats.nodes).toBe(0);
    expect(stats.size).toBe(100);
    expect(stats.depth).toBe(0);
    expect(stats.typeDistribution.object).toBe(0);
  });

  it('should calculate stats for simple object', () => {
    const node: TTreeNode = {
      type: 'object',
      key: 'root',
      value: null,
      children: [
        { type: 'string', key: 'name', value: 'John' },
        { type: 'number', key: 'age', value: 30 }
      ]
    };
    const stats = StatisticsCalculator.calculate(node, 50, 'json', true, 2);
    expect(stats.nodes).toBe(3);
    expect(stats.depth).toBe(2);
    expect(stats.maxWidth).toBe(2);
    expect(stats.typeDistribution.object).toBe(1);
    expect(stats.typeDistribution.string).toBe(1);
    expect(stats.typeDistribution.number).toBe(1);
  });

  it('should calculate stats for nested structure', () => {
    const node: TTreeNode = {
      type: 'object',
      key: 'root',
      value: null,
      children: [
        {
          type: 'array',
          key: 'items',
          value: null,
          children: [
            { type: 'boolean', key: '[0]', value: true },
            { type: 'null', key: '[1]', value: null }
          ]
        }
      ]
    };
    const stats = StatisticsCalculator.calculate(node, 100, 'json', true, 10);
    expect(stats.nodes).toBe(4);
    expect(stats.depth).toBe(3);
    expect(stats.maxWidth).toBe(2); // items array has 2 children
    expect(stats.typeDistribution.array).toBe(1);
    expect(stats.typeDistribution.boolean).toBe(1);
    expect(stats.typeDistribution.null).toBe(1);
  });
});
