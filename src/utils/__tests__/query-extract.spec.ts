import { describe, expect, it } from 'vitest';
import TreeTransformer from '../tree-transformer';
import { executeQuery, queryResultsToCsv } from '../query-extract';
import { parseDocumentToTree } from '../document-pipeline';

describe('query-extract', () => {
  it('extracts values with JSONPath child, wildcard, quoted keys, and recursive selectors', () => {
    const tree = TreeTransformer.transform({
      users: [
        { id: 1, 'profile.name': 'Ada' },
        { id: 2, 'profile.name': 'Linus' },
      ],
    });

    expect(executeQuery(tree, 'json', '$.users[*].id').results.map(item => item.value)).toEqual([1, 2]);
    expect(executeQuery(tree, 'json', "$.users[0]['profile.name']").results[0]?.value).toBe('Ada');
    expect(executeQuery(tree, 'json', '$..id').results).toHaveLength(2);
  });

  it('extracts values with XPath child and recursive selectors', () => {
    const parsed = parseDocumentToTree('<root><item id="1">A</item><item id="2">B</item></root>', 'xml');

    expect(parsed.tree).toBeTruthy();
    const items = executeQuery(parsed.tree, 'xml', '//item');
    const secondItem = executeQuery(parsed.tree, 'xml', '/root/item[2]/text');

    expect(items.results).toHaveLength(2);
    expect(secondItem.results[0]?.value).toBe('B');
  });

  it('returns a readable error for invalid query syntax', () => {
    const tree = TreeTransformer.transform({ id: 1 });
    const result = executeQuery(tree, 'json', 'id');

    expect(result.success).toBe(false);
    expect(result.error).toContain('$');
  });

  it('serializes query results to CSV', () => {
    const tree = TreeTransformer.transform({ id: 1 });
    const result = executeQuery(tree, 'json', '$.id');

    expect(queryResultsToCsv(result.results)).toContain('"$.id","number","1"');
  });
});
