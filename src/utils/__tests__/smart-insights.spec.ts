import { describe, expect, it } from 'vitest';
import TreeTransformer from '../tree-transformer';
import { analyzeSmartInsights } from '../smart-insights';

describe('smart-insights', () => {
  it('detects risky and structural payload signals', () => {
    const tree = TreeTransformer.transform({
      users: [
        { id: 1, token: 'abc', createdAt: '2026-05-13T10:00:00Z', tags: [] },
        { id: 1, password: 'secret', createdAt: '05/13/2026', profile: null },
        'unexpected',
      ],
      emptyObject: {},
      nested: { one: { two: { three: 'deep' } } },
    });

    const insights = analyzeSmartInsights(tree);

    expect(insights.suspiciousFields.map(item => item.key)).toEqual(expect.arrayContaining(['token', 'password']));
    expect(insights.nullableFields.map(item => item.jsonPath)).toContain('$.users[1].profile');
    expect(insights.emptyCollections.map(item => item.jsonPath)).toEqual(expect.arrayContaining(['$.users[0].tags', '$.emptyObject']));
    expect(insights.mixedTypeArrays[0]?.jsonPath).toBe('$.users');
    expect(insights.duplicateIds[0]).toMatchObject({ value: '1', count: 2 });
    expect(insights.deepestPaths[0]?.depth).toBeGreaterThanOrEqual(4);
    expect(insights.largestBranches[0]?.jsonPath).toBe('$');
    expect(insights.dateFormats.map(item => item.format)).toEqual(expect.arrayContaining(['ISO datetime', 'US date']));
  });
});
