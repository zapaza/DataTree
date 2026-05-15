/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useDocumentStore } from '../documentStore';

class MockWorker {
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: ErrorEvent) => void) | null = null;

  public postMessage() {}

  public terminate() {}
}

describe('documentStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.stubGlobal('Worker', MockWorker);
  });

  it('restores the saved document format after reload', () => {
    localStorage.setItem('datatree_raw_input', '<root><item>ok</item></root>');
    localStorage.setItem('datatree_format', 'xml');

    const store = useDocumentStore();

    expect(store.rawInput).toBe('<root><item>ok</item></root>');
    expect(store.format).toBe('xml');
  });

  it('detects XML for legacy saved input without a stored format', () => {
    localStorage.setItem('datatree_raw_input', '<root><item>ok</item></root>');

    const store = useDocumentStore();

    expect(store.format).toBe('xml');
  });
});
