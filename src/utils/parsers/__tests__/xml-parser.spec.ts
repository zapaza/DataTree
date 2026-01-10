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
    expect(tree.children).toHaveLength(1); // 'item'
    const itemNode = tree.children?.[0];
    expect(itemNode?.key).toBe('item');
    expect(itemNode?.children).toHaveLength(2); // '@id' and 'text'
    expect(itemNode?.children?.find(c => c.key === '@id')?.value).toBe('1');
    expect(itemNode?.children?.find(c => c.key === 'text')?.value).toBe('Hello');
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
    expect(tree.children).toHaveLength(2);
    expect(tree.children?.[0].key).toBe('item[0]');
    expect(tree.children?.[0].value).toBe('1');
    expect(tree.children?.[1].key).toBe('item[1]');
    expect(tree.children?.[1].value).toBe('2');
  });

  it('should handle CDATA', () => {
    const xml = '<root><![CDATA[Some content]]></root>';
    const result = XmlParser.parse(xml);
    const tree = XmlToJsonConverter.convert(result.data.root);
    expect(tree.value).toBe('Some content');
  });
});
