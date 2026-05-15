import { describe, it, expect } from 'vitest';
import SafeJsonParser from '../json-parser';

describe('SafeJsonParser', () => {
  describe('parse', () => {
    it('should parse valid JSON', () => {
      const json = '{"key": "value", "num": 123}';
      const result = SafeJsonParser.parse(json);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ key: "value", num: 123 });
    });

    it('should return error for invalid JSON', () => {
      const json = '{"key": "value", "num": 123,}';
      const result = SafeJsonParser.parse(json);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.line).toBe(1);
      // Проверяем наличие сообщения, не привязываясь к конкретному тексту (он зависит от движка JS)
      expect(result.error?.message).toBeTruthy();
    });

    it('should return error for multiline invalid JSON', () => {
      const json = '{\n  "key": "value",\n  "num": 123,\n}';
      const result = SafeJsonParser.parse(json);
      expect(result.success).toBe(false);
      expect(result.error?.line).toBe(4);
    });
  });

  describe('fix', () => {
    it('should fix trailing commas', () => {
      const json = '{"key": "value",}';
      const fixed = SafeJsonParser.fix(json);
      expect(JSON.parse(fixed)).toEqual({ key: "value" });
    });

    it('should add quotes to keys', () => {
      const json = '{key: "value"}';
      const fixed = SafeJsonParser.fix(json);
      expect(JSON.parse(fixed)).toEqual({ key: "value" });
    });

    it('should fix unclosed quotes', () => {
      const json = '{"key": "value}';
      const fixed = SafeJsonParser.fix(json);
      expect(JSON.parse(fixed)).toEqual({ key: "value" });
    });

    it('should fix complex unclosed quotes with comma', () => {
      const json = '{\n  "key": "value,\n  "num": 123\n}';
      const fixed = SafeJsonParser.fix(json);
      expect(JSON.parse(fixed)).toEqual({ key: "value", num: 123 });
    });

    it('should not rewrite key-like text inside valid strings', () => {
      const json = '{"note":"{key: value}","url":"https://example.com?a:b","text":"name: Ada"}';
      const fixed = SafeJsonParser.fix(json);

      expect(fixed).toBe(json);
      expect(JSON.parse(fixed)).toEqual({
        note: '{key: value}',
        url: 'https://example.com?a:b',
        text: 'name: Ada',
      });
    });

    it('should only quote unquoted object keys outside strings', () => {
      const json = '{user: {name: "Ada", note: "{role: admin}"}, list: [{id: 1, value: "x:y"}]}';
      const fixed = SafeJsonParser.fix(json);

      expect(JSON.parse(fixed)).toEqual({
        user: { name: 'Ada', note: '{role: admin}' },
        list: [{ id: 1, value: 'x:y' }],
      });
    });

    it('should convert single quoted keys without touching string values', () => {
      const json = "{'user': { 'name': \"Ada\", \"note\": \"'role': admin\" }}";
      const fixed = SafeJsonParser.fix(json);

      expect(JSON.parse(fixed)).toEqual({
        user: { name: 'Ada', note: "'role': admin" },
      });
    });

    it('should preserve valid JSON across key-like fuzz samples', () => {
      const samples = [
        { note: 'key: value', nested: '{foo: bar}', list: ['a:b', '{id: 1}'] },
        { url: 'https://example.test/path?a:b', css: 'color: red; padding: 4px' },
        { quote: '\\"key\\": still text', bracket: 'value} more text' },
      ];

      samples.forEach((sample) => {
        const json = JSON.stringify(sample);
        const fixed = SafeJsonParser.fix(json);
        expect(JSON.parse(fixed)).toEqual(sample);
      });
    });
  });
});
