import { describe, it, expect } from 'vitest';
import SafeJsonParser from '../utils/parsers/json-parser';
import TreeTransformer from '../utils/tree-transformer';
import StatisticsCalculator from '../utils/statistics';

describe('Performance Tests', () => {
  it('should parse and transform 10MB JSON in reasonable time', () => {
    // Generate 10MB JSON
    const data: any = { items: [] };
    for (let i = 0; i < 50000; i++) {
      data.items.push({
        id: i,
        name: `Item ${i}`,
        description: `This is a long description for item ${i} to increase size`,
        isActive: i % 2 === 0,
        tags: ['a', 'b', 'c', 'd'],
        metadata: {
          created: '2023-01-01',
          version: 1.0
        }
      });
    }

    const json = JSON.stringify(data);
    const sizeMB = json.length / (1024 * 1024);
    console.log(`Test data size: ${sizeMB.toFixed(2)} MB`);

    // Test parsing
    const parseStart = performance.now();
    const result = SafeJsonParser.parse(json);
    const parseEnd = performance.now();
    const parseDuration = parseEnd - parseStart;

    expect(result.success).toBe(true);
    console.log(`Parse duration: ${parseDuration.toFixed(2)} ms`);

    // Test transformation
    const transformStart = performance.now();
    const tree = TreeTransformer.transform(result.data);
    const transformEnd = performance.now();
    const transformDuration = transformEnd - transformStart;

    expect(tree).toBeDefined();
    console.log(`Transform duration: ${transformDuration.toFixed(2)} ms`);

    // Test statistics
    const statsStart = performance.now();
    const stats = StatisticsCalculator.calculate(tree, json.length, 'json', true, parseDuration);
    const statsEnd = performance.now();
    const statsDuration = statsEnd - statsStart;

    expect(stats.nodes).toBeGreaterThan(300000); // 50000 * 6 nodes + root + items
    console.log(`Stats duration: ${statsDuration.toFixed(2)} ms`);
    console.log(`Total nodes: ${stats.nodes}`);

    // We expect 10MB to be processed under 2 seconds on a typical machine
    expect(parseDuration + transformDuration + statsDuration).toBeLessThan(3000);
  });

  it('should handle deep nesting without stack overflow', () => {
    const depth = 1000;
    let deep: any = { value: 'leaf' };
    for (let i = 0; i < depth; i++) {
      deep = { child: deep };
    }

    const json = JSON.stringify(deep);

    const parseStart = performance.now();
    const result = SafeJsonParser.parse(json);
    const parseEnd = performance.now();
    expect(result.success).toBe(true);

    const transformStart = performance.now();
    const tree = TreeTransformer.transform(result.data);
    const transformEnd = performance.now();
    expect(tree).toBeDefined();

    const stats = StatisticsCalculator.calculate(tree, json.length, 'json', true, parseEnd - parseStart);
    expect(stats.depth).toBe(depth + 2); // transformer root + depth levels + leaf

    console.log(`Deep nesting (${depth} levels) duration: ${(transformEnd - transformStart).toFixed(2)} ms`);
  });
});
