import { describe, it, expect } from 'vitest';
import LCS from '../lcs';

describe('LCS', () => {
  const isEqual = (a: any, b: any) => a === b;

  it('should compute LCS for small arrays', () => {
    const a = [1, 2, 3];
    const b = [1, 4, 3];
    const result = LCS.diff(a, b, isEqual);

    expect(result).toEqual([
      { type: 'unchanged', item: 1, indexA: 0, indexB: 0 },
      { type: 'removed', item: 2, indexA: 1, indexB: -1 },
      { type: 'added', item: 4, indexA: -1, indexB: 1 },
      { type: 'unchanged', item: 3, indexA: 2, indexB: 2 }
    ]);
  });

  it('should use simpleDiff for very large arrays', () => {
    const size = 6000;
    const a = Array.from({ length: size }, (_, i) => i);
    const b = Array.from({ length: size }, (_, i) => i);
    b[100] = -1; // change one element

    const result = LCS.diff(a, b, isEqual);
    // Since it's > 5000, it should use simpleDiff
    expect(result.length).toBeGreaterThan(size); // removed + added for changed element
    expect(result.filter(r => r.type === 'unchanged').length).toBe(size - 1);
  });

  it('should handle completely different arrays', () => {
    const a = [1, 2];
    const b = [3, 4];
    const result = LCS.diff(a, b, isEqual);
    expect(result.filter(r => r.type === 'unchanged').length).toBe(0);
  });
});
