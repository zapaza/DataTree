import { describe, it, expect, vi } from 'vitest';
import FileUtils from '../file-utils';

describe('FileUtils', () => {
  it('should correctly identify formats by extension', () => {
    expect(FileUtils.getFormatByExtension('test.json')).toBe('json');
    expect(FileUtils.getFormatByExtension('data.XML')).toBe('xml');
    expect(FileUtils.getFormatByExtension('image.png')).toBe(null);
    expect(FileUtils.getFormatByExtension('no-extension')).toBe(null);
  });

  it('should check file size correctly', () => {
    const smallFile = { size: 5 * 1024 * 1024 } as File;
    const largeFile = { size: 15 * 1024 * 1024 } as File;

    expect(FileUtils.checkFileSize(smallFile, 10)).toBe(true);
    expect(FileUtils.checkFileSize(largeFile, 10)).toBe(false);
  });

  it('should save file (trigger download)', () => {
    // В обычной среде Node.js document не определен, поэтому мы мокаем его целиком
    // если он не существует
    if (typeof document === 'undefined') {
      global.document = {
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn()
        },
        createElement: vi.fn().mockReturnValue({ click: vi.fn() })
      } as any;
    }

    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    // Мокаем URL если он не определен или для стабильности
    if (typeof URL.createObjectURL === 'undefined') {
      URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      URL.revokeObjectURL = vi.fn();
    }

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

    FileUtils.saveFile('content', 'test.json', 'application/json');

    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});
