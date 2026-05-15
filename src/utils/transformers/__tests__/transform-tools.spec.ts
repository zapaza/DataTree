import { describe, expect, it } from 'vitest';
import {
  flattenToTable,
  jsonToXml,
  redactValue,
  runTransform,
  tableToCsv,
  xmlToJson,
  type TTransformOptions,
} from '../transform-tools';

const options: TTransformOptions = {
  xml: {
    rootName: 'payload',
    attributePrefix: '@_',
    textNodeName: '#text',
    format: true,
  },
  redact: {
    commonKeys: true,
    customKeys: '',
    mask: '[MASKED]',
  },
};

describe('transform tools', () => {
  it('converts JSON values to XML with configurable attributes and text nodes', () => {
    const xml = jsonToXml({
      user: {
        '@_id': 1,
        '#text': 'Ada',
      },
    }, options.xml);

    expect(xml).toContain('<user id="1">Ada</user>');
  });

  it('converts XML to JSON using the same attribute/text node options', () => {
    const json = JSON.parse(xmlToJson('<user id="1">Ada</user>', options.xml));

    expect(json.user['@_id']).toBe(1);
    expect(json.user['#text']).toBe('Ada');
  });

  it('flattens nested API arrays into CSV-ready rows', () => {
    const table = flattenToTable({
      data: [
        { id: 1, profile: { email: 'a@example.com' } },
        { id: 2, profile: { email: 'b@example.com' } },
      ],
    });

    expect(table.sourcePath).toBe('$.data');
    expect(table.columns).toEqual(['id', 'profile.email']);
    expect(table.rows[0]?.['profile.email']).toBe('a@example.com');
    expect(tableToCsv(table)).toContain('id,profile.email');
  });

  it('redacts common secret keys and records matches', () => {
    const result = redactValue({
      token: 'abc',
      user: {
        password: '123',
        name: 'Ada',
      },
    }, options.redact);

    expect(result.value).toEqual({
      token: '[MASKED]',
      user: {
        password: '[MASKED]',
        name: 'Ada',
      },
    });
    expect(result.matches.map(match => match.jsonPath)).toEqual(['$.token', '$.user.password']);
  });

  it('runs code generation transforms from payloads', () => {
    const result = runTransform('fetchSnippet', '{"id":1}', 'json', options);

    expect(result.ok).toBe(true);
    expect(result.output).toContain('fetchApiPayload');
    expect(result.output).toContain('AxiosInstance');
  });

  it('runs JSON formatting transforms', () => {
    const result = runTransform('sortKeys', '{"b":2,"a":1}', 'json', options);

    expect(result.ok).toBe(true);
    expect(result.output.indexOf('"a"')).toBeLessThan(result.output.indexOf('"b"'));
  });
});
