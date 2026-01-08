import { describe, it, expect } from 'vitest';
import JsonXmlConverter from '../json-xml-converter';

describe('JsonXmlConverter', () => {
  it('should convert JSON to XML', () => {
    const json = '{"root": {"item": "Hello"}}';
    const xml = JsonXmlConverter.jsonToXml(json);
    expect(xml).toContain('<root>');
    expect(xml).toContain('<item>Hello</item>');
  });

  it('should wrap JSON in root if multiple keys', () => {
    const json = '{"a": 1, "b": 2}';
    const xml = JsonXmlConverter.jsonToXml(json);
    expect(xml).toContain('<root>');
    expect(xml).toContain('<a>1</a>');
    expect(xml).toContain('<b>2</b>');
  });

  it('should convert XML to JSON', () => {
    const xml = '<root><item>Hello</item></root>';
    const jsonStr = JsonXmlConverter.xmlToJson(xml);
    const json = JSON.parse(jsonStr!);
    expect(json.root.item).toBe('Hello');
  });
});
