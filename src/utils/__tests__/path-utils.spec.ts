import { describe, it, expect } from 'vitest';
import PathUtils from '../path-utils';

describe('PathUtils', () => {
  const testPath = 'root.users.[0].profile.name';

  it('should generate JS path correctly', () => {
    expect(PathUtils.getNodePath(testPath, 'js')).toBe('users[0].profile.name');
    expect(PathUtils.getNodePath('root', 'js')).toBe('');
    expect(PathUtils.getNodePath('root.item', 'js')).toBe('item');
  });

  it('should generate JSONPath correctly', () => {
    expect(PathUtils.getNodePath(testPath, 'jsonpath')).toBe('$.users[0].profile.name');
    expect(PathUtils.getNodePath('root', 'jsonpath')).toBe('$');
    expect(PathUtils.getNodePath('root.item', 'jsonpath')).toBe('$.item');
  });

  it('should generate XPath correctly', () => {
    expect(PathUtils.getNodePath(testPath, 'xpath')).toBe('/users/*[1]/profile/name');
    expect(PathUtils.getNodePath('root', 'xpath')).toBe('/');
    expect(PathUtils.getNodePath('root.items.[5]', 'xpath')).toBe('/items/*[6]');
  });

  it('should format values correctly', () => {
    expect(PathUtils.formatValue('test', 'string')).toBe('test');
    expect(PathUtils.formatValue(123, 'number')).toBe('123');
    expect(PathUtils.formatValue(null, 'null')).toBe('null');
    expect(PathUtils.formatValue({ a: 1 }, 'object')).toContain('"a": 1');
  });
});
