import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  shortcuts: [
    ['bg-base', 'bg-white dark:bg-[#1e1e1e]'],
    ['bg-secondary', 'bg-gray-50/50 dark:bg-[#252526]'],
    ['bg-sidebar', 'bg-gray-50 dark:bg-[#181818]'],
    ['border-base', 'border-gray-200 dark:border-[#333333]'],
    ['border-light', 'border-gray-100 dark:border-[#2d2d2d]'],
    ['text-base', 'text-gray-900 dark:text-[#cccccc]'],
    ['text-muted', 'text-gray-500 dark:text-[#888888]'],
    ['text-light', 'text-gray-400 dark:text-[#666666]'],
  ],
  presets: [
    presetUno(),
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
