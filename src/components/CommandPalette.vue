<template>
  <Teleport to="body">
    <Transition name="palette">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[150] flex items-start justify-center bg-black/35 px-3 pt-16 backdrop-blur-[2px] sm:pt-24"
        @click.self="close"
      >
        <section class="flex max-h-[78vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-base bg-base shadow-2xl">
          <div class="flex items-center gap-3 border-b border-base bg-secondary px-4 py-3">
            <div class="i-carbon-search text-lg text-blue-500" />
            <input
              ref="searchInput"
              v-model="query"
              class="min-w-0 flex-1 bg-transparent text-sm text-base outline-none"
              :placeholder="t('command.placeholder')"
              @keydown.down.prevent="move(1)"
              @keydown.up.prevent="move(-1)"
              @keydown.enter.prevent="runActive"
              @keydown.esc.prevent="close"
            >
            <kbd class="rounded border border-base bg-base px-1.5 py-0.5 text-[10px] font-bold text-light">Esc</kbd>
          </div>

          <div class="max-h-[64vh] overflow-auto p-2 custom-scrollbar">
            <button
              v-for="(command, index) in filteredCommands"
              :key="command.id"
              class="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left transition-colors"
              :class="index === activeIndex ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'text-muted hover:bg-secondary'"
              @mouseenter="activeIndex = index"
              @click="runCommand(command)"
            >
              <div :class="command.icon" class="text-lg shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold">{{ command.label }}</div>
                <div class="truncate text-[11px] text-light">{{ command.description }}</div>
              </div>
              <div class="flex items-center gap-1">
                <span class="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold uppercase text-light">{{ command.group }}</span>
                <kbd
                  v-if="command.shortcut"
                  class="rounded border border-base bg-base px-1.5 py-0.5 text-[10px] font-bold text-light"
                >
                  {{ command.shortcut }}
                </kbd>
              </div>
            </button>

            <div
              v-if="filteredCommands.length === 0"
              class="flex flex-col items-center justify-center px-6 py-12 text-center text-light"
            >
              <div class="i-carbon-search-locate mb-3 text-4xl opacity-30" />
              <p class="text-sm">{{ t('command.noCommand') }}</p>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { PRODUCT_MODES } from '@/config/product-modes';
import { EXAMPLES } from '@/data/examples';
import { useDocumentStore } from '@/stores/documentStore';
import { useTransformStore } from '@/stores/transformStore';
import type { TTransformTool } from '@/utils/transformers/transform-tools';
import useI18n from '@/composables/useI18n';

type TCommand = {
  id: string;
  label: string;
  description: string;
  group: string;
  icon: string;
  shortcut?: string;
  run: () => void | Promise<void>;
};

const router = useRouter();
const documentStore = useDocumentStore();
const transformStore = useTransformStore();
const { t } = useI18n();
const isOpen = ref(false);
const query = ref('');
const activeIndex = ref(0);
const searchInput = ref<HTMLInputElement | null>(null);

const modeCommands = computed<TCommand[]>(() => PRODUCT_MODES.map((mode, index) => ({
  id: `mode:${mode.id}`,
  label: t('command.goTo', { mode: t(mode.labelKey) }),
  description: t(`modes.${mode.id}.commandDescription`),
  group: t('command.group.mode'),
  icon: mode.icon,
  shortcut: `Alt+${index + 1}`,
  run: async () => {
    await router.push(mode.path);
  },
})));

const exampleName = (example: (typeof EXAMPLES)[number]) => t(`examples.items.${example.id}.name`);
const exampleDescription = (example: (typeof EXAMPLES)[number]) => t(`examples.items.${example.id}.description`);

const exampleCommands = computed<TCommand[]>(() => EXAMPLES.slice(0, 12).map(example => ({
  id: `example:${example.id}`,
  label: t('command.load', { name: exampleName(example) }),
  description: `${example.format.toUpperCase()} ${t('examples.example')} · ${exampleDescription(example)}`,
  group: t('command.group.example'),
  icon: example.format === 'xml' ? 'i-carbon-xml' : 'i-carbon-json',
  run: () => {
    documentStore.setRawInput(example.content);
    documentStore.setFormat(example.format);
    if (example.schema) documentStore.setValidationSchema(example.schema);
  },
})));

const transformCommands = computed<TCommand[]>(() => [
  { id: 'action:format', label: t('command.actions.format'), description: t('command.actions.formatDescription'), group: t('command.group.action'), icon: 'i-carbon-center-to-fit', shortcut: 'Shift+F', run: () => documentStore.formatJson() },
  { id: 'action:minify', label: t('command.actions.minify'), description: t('command.actions.minifyDescription'), group: t('command.group.action'), icon: 'i-carbon-bring-to-front', shortcut: 'Shift+M', run: () => documentStore.minifyJson() },
  { id: 'action:sort', label: t('command.actions.sort'), description: t('command.actions.sortDescription'), group: t('command.group.action'), icon: 'i-carbon-sort-ascending', shortcut: 'Shift+S', run: () => documentStore.sortKeys() },
  { id: 'action:convert', label: t('command.actions.convert'), description: t('command.actions.convertDescription'), group: t('command.group.action'), icon: 'i-carbon-arrows-horizontal', shortcut: 'Shift+X', run: () => documentStore.convertFormat() },
]);

const transformToolItems: Array<{ tool: TTransformTool; labelKey: string; descriptionKey: string; icon: string }> = [
  { tool: 'flattenCsv', labelKey: 'command.actions.csv', descriptionKey: 'command.actions.csvDescription', icon: 'i-carbon-table' },
  { tool: 'redact', labelKey: 'command.actions.redact', descriptionKey: 'command.actions.redactDescription', icon: 'i-carbon-security' },
  { tool: 'typescript', labelKey: 'command.actions.typescript', descriptionKey: 'command.actions.typescriptDescription', icon: 'i-carbon-code' },
  { tool: 'zod', labelKey: 'command.actions.zod', descriptionKey: 'command.actions.zodDescription', icon: 'i-carbon-script' },
  { tool: 'fetchSnippet', labelKey: 'command.actions.fetch', descriptionKey: 'command.actions.fetchDescription', icon: 'i-carbon-api' },
];

const transformToolCommands = computed<TCommand[]>(() => transformToolItems.map(({ tool, labelKey, descriptionKey, icon }) => ({
  id: `transform:${tool}`,
  label: t(labelKey),
  description: t(descriptionKey),
  group: t('command.group.transform'),
  icon,
  run: async () => {
    transformStore.setTool(tool);
    await router.push('/transform');
  },
})));

const commands = computed<TCommand[]>(() => [
  ...modeCommands.value,
  ...transformCommands.value,
  ...transformToolCommands.value,
  ...exampleCommands.value,
]);

const normalizedQuery = computed(() => query.value.trim().toLowerCase());

const filteredCommands = computed(() => {
  if (!normalizedQuery.value) return commands.value;
  return commands.value.filter(command => [
    command.label,
    command.description,
    command.group,
  ].some(value => value.toLowerCase().includes(normalizedQuery.value)));
});

const open = () => {
  isOpen.value = true;
  query.value = '';
  activeIndex.value = 0;
  void nextTick(() => searchInput.value?.focus());
};

const close = () => {
  isOpen.value = false;
};

const move = (offset: number) => {
  if (filteredCommands.value.length === 0) return;
  activeIndex.value = (activeIndex.value + offset + filteredCommands.value.length) % filteredCommands.value.length;
};

const runCommand = async (command: TCommand) => {
  await command.run();
  close();
};

const runActive = () => {
  const command = filteredCommands.value[activeIndex.value];
  if (command) void runCommand(command);
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
};

const handleKeydown = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  const mod = event.metaKey || event.ctrlKey;

  if (mod && key === 'k') {
    event.preventDefault();
    if (isOpen.value) close();
    else open();
    return;
  }

  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault();
    close();
    return;
  }

  if (isOpen.value || isEditableTarget(event.target)) return;

  if (event.altKey && /^[1-4]$/.test(event.key)) {
    event.preventDefault();
    const mode = PRODUCT_MODES[Number(event.key) - 1];
    if (mode) void router.push(mode.path);
    return;
  }

  if (event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
    if (key === 'f') documentStore.formatJson();
    else if (key === 'm') documentStore.minifyJson();
    else if (key === 's') documentStore.sortKeys();
    else if (key === 'x') documentStore.convertFormat();
  }
};

watch(filteredCommands, () => {
  activeIndex.value = 0;
});

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('datatree:open-command-palette', open);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('datatree:open-command-palette', open);
});
</script>

<style scoped>
.palette-enter-active,
.palette-leave-active {
  transition: opacity 0.16s ease;
}

.palette-enter-from,
.palette-leave-to {
  opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #374151;
}
</style>
