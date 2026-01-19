import { describe, it, expect } from 'vitest';
import XmlParser from '../../parsers/xml-parser';
import { diffJson } from '../json-diff';

describe('XML Diff Integration', () => {
  it('should detect differences in XML attributes', () => {
    const xml1 = '<user id="1" name="John"/>';
    const xml2 = '<user id="1" name="Doe"/>';

    const res1 = XmlParser.parse(xml1);
    const res2 = XmlParser.parse(xml2);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);

    const result = diffJson(res1.data, res2.data);

    // fast-xml-parser produces { user: { '@_id': 1, '@_name': 'John' } }
    expect(result.stats.modified).toBe(1);
    const change = result.changes.find(c => c.path === '/user/@_name');
    expect(change).toBeDefined();
    expect(change?.type).toBe('modified');
    expect(change?.oldValue).toBe('John');
    expect(change?.newValue).toBe('Doe');
  });

  it('should detect added and removed tags', () => {
    const xml1 = '<root><a/><b/></root>';
    const xml2 = '<root><a/><c/></root>';

    const res1 = XmlParser.parse(xml1);
    const res2 = XmlParser.parse(xml2);

    const result = diffJson(res1.data, res2.data);

    expect(result.stats.added).toBe(1); // tag c
    expect(result.stats.removed).toBe(1); // tag b
    expect(result.changes.find(c => c.path === '/root/b' && c.type === 'removed')).toBeDefined();
    expect(result.changes.find(c => c.path === '/root/c' && c.type === 'added')).toBeDefined();
  });

  it('should detect differences in text content', () => {
    const xml1 = '<note>Hello</note>';
    const xml2 = '<note>World</note>';

    const res1 = XmlParser.parse(xml1);
    const res2 = XmlParser.parse(xml2);

    const result = diffJson(res1.data, res2.data);

    // note: with default settings fast-xml-parser might put text into the tag directly if no attributes
    // { note: 'Hello' } vs { note: 'World' }
    expect(result.stats.modified).toBe(1);
    expect(result.changes.find(c => c.path === '/note' && c.type === 'modified')).toBeDefined();
  });
});
