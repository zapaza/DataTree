import { describe, it, expect } from 'vitest';
import SchemaValidator from '../schema-validator';

describe('SchemaValidator', () => {
  it('should validate simple schema', () => {
    const data = { name: 'John', age: 30 };
    const schema = '{"name": "string", "age": "number"}';
    const result = SchemaValidator.validate(data, schema);
    expect(result.success).toBe(true);
  });

  it('should return errors for invalid data', () => {
    const data = { name: 'John', age: '30' };
    const schema = '{"name": "string", "age": "number"}';
    const result = SchemaValidator.validate(data, schema);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('age');
  });

  it('should handle nested objects', () => {
    const data = { user: { id: 1 } };
    const schema = '{"user": {"id": "number"}}';
    const result = SchemaValidator.validate(data, schema);
    expect(result.success).toBe(true);
  });

  it('should handle arrays', () => {
    const data = { tags: ['vue', 'ts'] };
    const schema = '{"tags": ["string"]}';
    const result = SchemaValidator.validate(data, schema);
    expect(result.success).toBe(true);
  });
});
