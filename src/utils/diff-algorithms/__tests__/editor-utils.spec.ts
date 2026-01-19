import { describe, it, expect } from 'vitest';
import { calculateRange } from '../editor-utils';

// Mock monaco
const monacoMock = {
  Range: class {
    constructor(public startLine: number, public startCol: number, public endLine: number, public endCol: number) {}
  }
} as any;

const modelMock = {
  getValue: () => JSON.stringify({
    a: 1,
    b: {
      c: [1, 2, 3]
    }
  }, null, 2),
  getPositionAt: (offset: number) => {
    // Very simple mock of getPositionAt
    const lines = JSON.stringify({
      a: 1,
      b: {
        c: [1, 2, 3]
      }
    }, null, 2).substring(0, offset).split('\n');
    return {
      lineNumber: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }
} as any;

describe('editor-utils', () => {
  it('should calculate range for root property', () => {
    const range = calculateRange(modelMock, '/a', monacoMock);
    expect(range).not.toBeNull();
    expect(range?.startLine).toBe(2);
  });

  it('should calculate range for nested property', () => {
    const range = calculateRange(modelMock, '/b/c', monacoMock);
    expect(range).not.toBeNull();
    expect(range?.startLine).toBe(4);
  });

  it('should calculate range for array element', () => {
    const range = calculateRange(modelMock, '/b/c/1', monacoMock);
    expect(range).not.toBeNull();
    expect(range?.startLine).toBe(6);
  });

  it('should return null for non-existent path', () => {
    const range = calculateRange(modelMock, '/nonexistent', monacoMock);
    expect(range).toBeNull();
  });
});
