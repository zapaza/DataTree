import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryDB, type THistoryItem } from '../history-db';
import 'fake-indexeddb/auto';

describe('HistoryDB', () => {
  let db: HistoryDB;

  beforeEach(async () => {
    db = new HistoryDB();
    await db.clear();
  });

  it('should save and retrieve history items', async () => {
    const item: THistoryItem = {
      timestamp: Date.now(),
      content: '{"a": 1}',
      format: 'json',
      isValid: true,
      nodesCount: 2
    };

    const id = await db.save(item);
    expect(id).toBeDefined();

    const all = await db.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].content).toBe('{"a": 1}');
  });

  it('should delete history items', async () => {
    const item: THistoryItem = {
      timestamp: Date.now(),
      content: 'test',
      format: 'json',
      isValid: true,
      nodesCount: 1
    };

    const id = await db.save(item);
    await db.delete(id);

    const all = await db.getAll();
    expect(all).toHaveLength(0);
  });

  it('should trim history to limit', async () => {
    for (let i = 0; i < 5; i++) {
      await db.save({
        timestamp: Date.now() + i,
        content: `item ${i}`,
        format: 'json',
        isValid: true,
        nodesCount: 1
      });
    }

    await db.trim(3);
    const all = await db.getAll();
    expect(all).toHaveLength(3);
    // Should keep the newest (higher timestamp)
    expect(all[0].content).toBe('item 4');
  });
});
