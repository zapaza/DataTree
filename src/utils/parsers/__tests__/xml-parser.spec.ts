import { describe, it, expect } from 'vitest';
import XmlParser from '../xml-parser';
import XmlToJsonConverter from '../xml-to-json';

describe('XmlParser', () => {
  it('should parse valid XML', () => {
    const xml = '<root><item id="1">Text</item></root>';
    const result = XmlParser.parse(xml);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.root.item['#text']).toBe('Text');
    expect(result.data.root.item['@_id']).toBe(1);
  });

  it('should return error for invalid XML', () => {
    const xml = '<root><item>Unclosed</root>';
    const result = XmlParser.parse(xml);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.line).toBeGreaterThan(0);
  });

  it('should handle attributes with @_ prefix', () => {
    const xml = '<node attr="val">content</node>';
    const result = XmlParser.parse(xml);
    expect(result.success).toBe(true);
    expect(result.data.node['@_attr']).toBe('val');
  });
});

describe('XmlToJsonConverter', () => {
  it('should convert flat object to tree', () => {
    const data = {
      root: {
        item: {
          '@_id': '1',
          '#text': 'Hello'
        }
      }
    };
    const tree = XmlToJsonConverter.convert(data.root);
    expect(tree.children).toHaveLength(1);
    expect(tree.children?.[0].attributes?.id).toBe('1');
    expect(tree.children?.[0].data).toBe('Hello');
  });

  it('should handle multiple children (arrays)', () => {
    const data = {
      root: {
        item: [
          { '#text': '1' },
          { '#text': '2' }
        ]
      }
    };
    const tree = XmlToJsonConverter.convert(data.root);
    // data.root содержит ключ 'item', который является массивом.
    // XmlToJsonConverter.convert(data.root) должен вернуть объект с children,
    // где каждый ребенок соответствует элементу из 'item'.
    expect(tree.children).toHaveLength(2);
    expect(tree.children?.[0].name).toBe('item');
    expect(tree.children?.[0].data).toBe('1');
    expect(tree.children?.[1].name).toBe('item');
    expect(tree.children?.[1].data).toBe('2');
  });

  it('should handle CDATA', () => {
    const xml = '<root><![CDATA[Some content]]></root>';
    const result = XmlParser.parse(xml);
    const tree = XmlToJsonConverter.convert(result.data.root);
    expect(tree.data).toBe('Some content');
  });
});
