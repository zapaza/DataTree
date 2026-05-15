import { describe, expect, it } from 'vitest';
import { diffGeneratedContracts } from '../contract-diff';

describe('contract-diff', () => {
  it('should classify removed required fields and type changes as breaking', () => {
    const result = diffGeneratedContracts(
      { id: 1, name: 'Ada' },
      { id: '1' }
    );

    expect(result.changes.find(change => change.displayPath === '$/name')).toMatchObject({
      risk: 'breaking',
      title: 'Removed required field',
    });
    expect(result.changes.find(change => change.displayPath === '$/id' && change.title === 'Type changed')).toMatchObject({
      risk: 'breaking',
    });
    expect(result.summary.breaking).toBeGreaterThanOrEqual(2);
  });

  it('should classify optional additive fields as non-breaking', () => {
    const result = diffGeneratedContracts(
      { users: [{ id: 1, name: 'Ada' }, { id: 2, name: 'Bob' }] },
      { users: [{ id: 1, name: 'Ada', role: 'admin' }, { id: 2, name: 'Bob' }] }
    );

    expect(result.changes.find(change => change.displayPath === '$/users[]/role')).toMatchObject({
      risk: 'non-breaking',
      title: 'Added optional field',
    });
  });

  it('should classify nullable direction changes', () => {
    const result = diffGeneratedContracts(
      { users: [{ id: 1, nickname: 'Ada' }, { id: 2, nickname: null }] },
      { users: [{ id: 1, nickname: 'Ada' }, { id: 2, nickname: 'Bob' }] }
    );

    expect(result.changes.find(change => change.displayPath === '$/users[]/nickname')).toMatchObject({
      risk: 'breaking',
      title: 'Nullable contract changed',
    });
  });
});
