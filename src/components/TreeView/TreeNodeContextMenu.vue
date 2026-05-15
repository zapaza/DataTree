<template>
  <div
    ref="menuRef"
    class="fixed z-50 min-w-[190px] bg-base border border-base rounded-lg shadow-xl py-1 text-sm font-sans"
    :style="{ left: `${x}px`, top: `${y}px` }"
    role="menu"
    :aria-label="t('tree.context.menu')"
  >
    <!-- Секция Копировать Путь -->
    <div class="px-3 py-1.5 text-[10px] font-bold text-light uppercase tracking-wider" role="presentation">
      {{ t('common.path') }}
    </div>
    <button
      class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-left text-base"
      role="menuitem"
      @click="copyPath('js')"
    >
      <div class="i-carbon-script text-light" />
      <span>{{ t('tree.context.jsNotation') }}</span>
    </button>
    <button
      class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-left text-base"
      role="menuitem"
      @click="copyPath('jsonpath')"
    >
      <div class="i-carbon-json text-light" />
      <span>{{ t('tree.context.jsonPath') }}</span>
    </button>
    <button
      class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-left text-base"
      role="menuitem"
      @click="copyPath('xpath')"
    >
      <div class="i-carbon-xml text-light" />
      <span>{{ t('tree.context.xPath') }}</span>
    </button>

    <div class="my-1 border-t border-light" />

    <!-- Секция Копировать Значение -->
    <button
      class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-left text-base"
      role="menuitem"
      @click="copyValue"
    >
      <div class="i-carbon-copy text-light" />
      <span>{{ t('tree.context.copyValue') }}</span>
    </button>
    <button
      class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-left text-base"
      role="menuitem"
      @click="copySubtree"
    >
      <div class="i-carbon-tree-view text-light" />
      <span>{{ t('tree.context.copySubtree') }}</span>
    </button>
    <button
      class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-left text-base"
      role="menuitem"
      @click="copyNodeAsJson"
    >
      <div class="i-carbon-code text-light" />
      <span>{{ t('tree.context.copyNodeJson') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import type { TTreeNode } from '@/types/store';
import PathUtils, { type TPathFormat } from '@/utils/path-utils';
import useClipboard from '@/composables/useClipboard';
import { stringifyTreeNodeAsJson, stringifyTreeNodeValue, treeNodeToValue } from '@/utils/tree-node-utils';
import useI18n from '@/composables/useI18n';

interface Props {
  node: TTreeNode;
  path: string;
  pathSegments?: string[];
  x: number;
  y: number;
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

const { copy } = useClipboard();
const { t } = useI18n();
const menuRef = ref<HTMLElement | null>(null);
const getPathInput = () => props.pathSegments ?? props.path;

const copyPath = (format: TPathFormat) => {
  const fullPath = PathUtils.getNodePath(getPathInput(), format);
  copy(fullPath, `${t('common.path')} ${format.toUpperCase()}`);
  emit('close');
};

const copyValue = () => {
  copy(stringifyTreeNodeValue(props.node), t('tree.context.copyValue'));
  emit('close');
};

const copySubtree = () => {
  copy(JSON.stringify(treeNodeToValue(props.node), null, 2), t('tree.context.copySubtree'));
  emit('close');
};

const copyNodeAsJson = () => {
  copy(stringifyTreeNodeAsJson(props.node, props.path, props.pathSegments ?? []), t('tree.context.copyNodeJson'));
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
