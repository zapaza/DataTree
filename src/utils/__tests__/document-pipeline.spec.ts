import { describe, expect, it } from 'vitest';
import { parseDocumentToTree, parsePayload } from '../document-pipeline';

describe('document-pipeline', () => {
  it('parses JSON payloads into the shared tree shape', () => {
    const result = parseDocumentToTree('{"user":{"id":1,"active":true}}', 'json');

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(result.tree?.key).toBe('root');
    expect(result.tree?.type).toBe('object');
    expect(result.tree?.children?.[0]?.key).toBe('user');
  });

  it('keeps JSON null as a valid tree node', () => {
    const result = parseDocumentToTree('null', 'json');

    expect(result.success).toBe(true);
    expect(result.parsed).toBeNull();
    expect(result.tree).toMatchObject({
      key: 'root',
      type: 'null',
      value: null,
    });
  });

  it('normalizes parse errors for invalid JSON', () => {
    const result = parseDocumentToTree('{"broken": }', 'json');

    expect(result.success).toBe(false);
    expect(result.tree).toBeNull();
    expect(result.error?.severity).toBe('error');
    expect(result.error?.message).toBeTruthy();
  });

  it('exposes the raw parser result for compare panels', () => {
    const result = parsePayload('{"same": true}', 'json');

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ same: true });
  });
});
