import { describe, expect, it } from 'vitest';
import { PRODUCT_MODES } from '@/config/product-modes';
import { EXAMPLES } from '@/data/examples';
import { parseDocumentToTree } from '@/utils/document-pipeline';
import { generateContract } from '@/utils/contracts/schema-generator';
import { validateJsonSchema } from '@/utils/contracts/json-schema-validator';
import { diffJson } from '@/utils/diff-algorithms/json-diff';
import { runTransform, type TTransformOptions } from '@/utils/transformers/transform-tools';

const transformOptions: TTransformOptions = {
  xml: {
    rootName: 'root',
    attributePrefix: '@_',
    textNodeName: '#text',
    format: true,
  },
  redact: {
    commonKeys: true,
    customKeys: '',
    mask: '[REDACTED]',
  },
};

describe('product smoke', () => {
  it('exposes the four product modes', () => {
    expect(PRODUCT_MODES.map(mode => mode.id)).toEqual(['inspect', 'validate', 'compare', 'transform']);
    expect(PRODUCT_MODES.every(mode => mode.path.startsWith('/'))).toBe(true);
  });

  it('runs inspect, validate, compare and transform engines against onboarding examples', () => {
    const restExample = EXAMPLES.find(example => example.id === 'api-response');
    expect(restExample).toBeTruthy();

    const parsed = parseDocumentToTree(restExample!.content, restExample!.format);
    expect(parsed.success).toBe(true);
    expect(parsed.tree?.children?.length).toBeGreaterThan(0);

    const value = JSON.parse(restExample!.content);
    const contract = generateContract(value, 'RestResponse');
    expect(validateJsonSchema(value, contract.jsonSchema, restExample!.content)).toEqual([]);

    const diff = diffJson({ status: 'success', total: 1 }, { status: 'success', total: 2 });
    expect(diff.stats.modified).toBe(1);

    const csv = runTransform('flattenCsv', restExample!.content, 'json', transformOptions);
    expect(csv.ok).toBe(true);
    expect(csv.table?.rows.length).toBeGreaterThan(0);
  });
});
