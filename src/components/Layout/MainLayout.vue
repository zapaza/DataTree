<template>
  <div class="h-screen flex flex-col bg-base overflow-hidden text-base font-sans">
    <slot name="header" />

    <div class="flex-1 flex overflow-hidden relative">
      <div v-if="!isMobile" class="h-full flex shrink-0">
        <slot name="sidebar" />
      </div>

      <main class="flex-1 flex overflow-hidden relative">
        <div v-if="$slots.content" class="flex-1 flex overflow-hidden">
          <slot name="content" />
        </div>
        <div
          v-else
          class="flex-1 grid grid-cols-1 lg:grid-cols-[var(--left-width)_auto_1fr] overflow-hidden bg-base"
          :class="{ 'grid-rows-[1fr_1fr]': isMobile }"
          :style="{ '--left-width': isMobile ? '100%' : `${leftWidth}%` }"
        >
          <div class="flex flex-col min-w-0 min-h-0 overflow-hidden border-r border-base" :class="{ 'border-r-0 border-b': isMobile }">
            <slot name="editor" />
          </div>

          <div
            v-if="!isMobile"
            class="hidden lg:block w-1 bg-gray-200 dark:bg-[#333333] h-full cursor-col-resize hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors"
            @mousedown="startResizing"
          />

          <div class="flex flex-col min-w-0 min-h-0 overflow-hidden bg-secondary">
            <slot name="tree" />
          </div>
        </div>

        <div v-if="!$slots.content" class="hidden xl:block w-72 border-l border-base bg-sidebar flex flex-col overflow-hidden">
          <slot name="right-sidebar" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import useResizable from '@/composables/useResizable';
import { useBreakpoints } from '@/composables/useBreakpoints';

const { leftWidth, startResizing } = useResizable(40);
const { isMobile } = useBreakpoints();
</script>
