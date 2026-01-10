import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWind4,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  shortcuts: [
    ['bg-base', 'bg-white dark:bg-[#1c1c1e]'],
    ['bg-secondary', 'bg-gray-50/70 dark:bg-[#232325]'],
    ['bg-sidebar', 'bg-gray-100 dark:bg-[#161617]'],
    ['border-base', 'border-gray-200 dark:border-[#2a2a2d]'],
    ['border-light', 'border-gray-100 dark:border-[#242426]'],
    ['text-base', 'text-gray-900 dark:text-[#e5e5e7]'],
    ['text-muted', 'text-gray-500 dark:text-[#a1a1a6]'],
    ['text-light', 'text-gray-400 dark:text-[#6e6e73]'],
  ],
  presets: [
    presetWind4(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})
