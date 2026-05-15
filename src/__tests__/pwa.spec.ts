import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('pwa configuration', () => {
  it('keeps install icons and offline precache configuration present', () => {
    const root = fileURLToPath(new URL('../..', import.meta.url));
    const viteConfig = readFileSync(new URL('../../vite.config.ts', import.meta.url), 'utf8');

    expect(viteConfig).toContain('VitePWA');
    expect(viteConfig).toContain('DataTree - Local API Payload Inspector');
    expect(viteConfig).toContain('globPatterns');
    expect(existsSync(`${root}/public/pwa-192x192.png`)).toBe(true);
    expect(existsSync(`${root}/public/pwa-512x512.png`)).toBe(true);
  });
});
