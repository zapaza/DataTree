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
  });
});
