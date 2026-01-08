<template>
  <div
    ref="menuRef"
    class="fixed z-50 min-w-[160px] bg-base border border-base rounded-lg shadow-xl py-1 text-sm font-sans"
    :style="{ left: `${x}px`, top: `${y}px` }"
    role="menu"
    aria-label="Node context menu"
  >
    <!-- Секция Копировать Путь -->
    <div class="px-3 py-1.5 text-[10px] font-bold text-light uppercase tracking-wider" role="presentation">
      Copy Path
    </div>
    <button
      class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-left text-base"
      role="menuitem"
      @click="copyPath('js')"
    >
      <div class="i-carbon-script text-light" />
      <span>JavaScript Notation</span>
    </button>
    <button
      class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-left text-base"
      role="menuitem"
      @click="copyPath('jsonpath')"
    >
      <div class="i-carbon-json text-light" />
      <span>JSONPath</span>
    </button>
    <button
      class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-left text-base"
      role="menuitem"
      @click="copyPath('xpath')"
    >
      <div class="i-carbon-xml text-light" />
      <span>XPath</span>
    </button>

    <div class="my-1 border-t border-light" />

    <!-- Секция Копировать Значение -->
    <button
      class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-left text-base"
      role="menuitem"
      @click="copyValue"
    >
      <div class="i-carbon-copy text-light" />
      <span>Copy Value</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import type { TTreeNode } from '@/types/store';
import PathUtils, { type TPathFormat } from '@/utils/path-utils';
import useClipboard from '@/composables/useClipboard';

interface Props {
  node: TTreeNode;
  path: string;
  x: number;
  y: number;
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

const { copy } = useClipboard();
const menuRef = ref<HTMLElement | null>(null);

const copyPath = (format: TPathFormat) => {
  const fullPath = PathUtils.getNodePath(props.path, format);
  copy(fullPath, `Path copied as ${format.toUpperCase()}`);
  emit('close');
};

const copyValue = () => {
  const valueToCopy = props.node.type === 'object' || props.node.type === 'array'
    ? JSON.stringify(props.node.value || {}, null, 2)
    : props.node.value;

  copy(String(valueToCopy), 'Value copied to clipboard');
  emit('close');
};

const handleClickOutside = (e: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('scroll', () => emit('close'), { passive: true });
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('scroll', () => emit('close'));
});
</script>

<style scoped>
/* Дополнительные стили если нужны */
</style>
