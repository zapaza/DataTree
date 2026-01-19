<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-hidden bg-base">
    <div class="flex-1 flex min-h-0 overflow-hidden relative">
      <!-- Main Content: Editors or Tree -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-base">
        <!-- Diff Stats Bar (Only if not showing Tree) -->
        <div v-if="diffStore.diffResult" class="px-4 py-2 border-b border-base bg-secondary flex gap-4 items-center justify-between shrink-0">
          <div class="flex gap-4 items-center">
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-full bg-green-500" />
              <span class="text-[10px] font-bold uppercase text-muted">Added: {{ diffStore.diffResult.stats.added }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-full bg-red-500" />
              <span class="text-[10px] font-bold uppercase text-muted">Removed: {{ diffStore.diffResult.stats.removed }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-full bg-amber-500" />
              <span class="text-[10px] font-bold uppercase text-muted">Modified: {{ diffStore.diffResult.stats.modified }}</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div v-if="diffStore.isComputingDiff" class="flex items-center gap-2 text-[10px] font-bold uppercase text-muted">
              <div class="i-carbon-circle-dash animate-spin text-xs" />
              <span>Computing diff…</span>
            </div>

            <label class="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                v-model="diffStore.showOnlyChanges"
                class="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-[10px] font-medium text-muted group-hover:text-base transition-colors">Only Changes</span>
            </label>

            <div class="h-4 w-px bg-base mx-1" />

            <button
              class="px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors"
              :class="viewMode === 'editor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-muted hover:bg-gray-100 dark:hover:bg-gray-800'"
              @click="viewMode = 'editor'"
            >
              Editor
            </button>
            <button
              class="px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors"
              :class="viewMode === 'tree' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-muted hover:bg-gray-100 dark:hover:bg-gray-800'"
              @click="viewMode = 'tree'"
            >
              Tree
            </button>

            <div class="h-4 w-px bg-base mx-1" />
          </div>
        </div>

        <div class="flex-1 relative min-h-0">
          <DiffEditor
            v-if="viewMode === 'editor'"
            v-model:left-value="diffStore.left.raw"
            v-model:right-value="diffStore.right.raw"
            :show-only-changes="diffStore.showOnlyChanges"
          >
            <!-- Left Panel Header -->
            <template #left-header>
              <div class="px-4 h-10 border-b border-light flex items-center bg-secondary justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold uppercase tracking-wider text-muted">Source A</span>

                  <div class="flex gap-1 ml-4 border-l border-base pl-4">
                    <button
                      class="px-2 py-0.5 text-[10px] rounded transition-colors"
                      :class="diffStore.left.format === 'json' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold' : 'text-muted hover:bg-gray-100 dark:hover:bg-gray-800'"
                      @click="diffStore.setLeftFormat('json')"
                    >
                      JSON
                    </button>
                    <button
                      class="px-2 py-0.5 text-[10px] rounded transition-colors"
                      :class="diffStore.left.format === 'xml' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold' : 'text-muted hover:bg-gray-100 dark:hover:bg-gray-800'"
                      @click="diffStore.setLeftFormat('xml')"
                    >
                      XML
                    </button>
                  </div>

                </div>
                <div class="flex gap-2">
                  <div
                    v-if="!diffStore.left.valid && diffStore.left.raw"
                    class="flex items-center gap-1 text-[10px] text-red-500 font-bold animate-pulse"
                  >
                    <div class="i-carbon-error text-xs" />
                    <span>INVALID {{ diffStore.left.format.toUpperCase() }}</span>
                  </div>
                  <button
                    class="p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors text-muted"
                    title="Import file"
                    @click="triggerLeftImport"
                  >
                    <div class="i-carbon-upload text-sm" />
                  </button>
                  <input
                    ref="leftFileInput"
                    type="file"
                    accept=".json,.xml"
                    class="hidden"
                    @change="onLeftFileChange"
                  />
                </div>
              </div>
            </template>

            <!-- Right Panel Header -->
            <template #right-header>
              <div class="px-4 h-10 border-b border-light flex items-center bg-secondary justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold uppercase tracking-wider text-muted">Source B</span>

                  <div class="flex gap-1 ml-4 border-l border-base pl-4">
                    <button
                      class="px-2 py-0.5 text-[10px] rounded transition-colors"
                      :class="diffStore.right.format === 'json' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold' : 'text-muted hover:bg-gray-100 dark:hover:bg-gray-800'"
                      @click="diffStore.setRightFormat('json')"
                    >
                      JSON
                    </button>
                    <button
                      class="px-2 py-0.5 text-[10px] rounded transition-colors"
                      :class="diffStore.right.format === 'xml' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold' : 'text-muted hover:bg-gray-100 dark:hover:bg-gray-800'"
                      @click="diffStore.setRightFormat('xml')"
                    >
                      XML
                    </button>
                  </div>

                </div>
                <div class="flex gap-2">
                  <div
                    v-if="!diffStore.right.valid && diffStore.right.raw"
                    class="flex items-center gap-1 text-[10px] text-red-500 font-bold animate-pulse"
                  >
                    <div class="i-carbon-error text-xs" />
                    <span>INVALID {{ diffStore.right.format.toUpperCase() }}</span>
                  </div>
                  <button
                    class="p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors text-muted"
                    title="Import file"
                    @click="triggerRightImport"
                  >
                    <div class="i-carbon-upload text-sm" />
                  </button>
                  <input
                    ref="rightFileInput"
                    type="file"
                    accept=".json,.xml"
                    class="hidden"
                    @change="onRightFileChange"
                  />
                </div>
              </div>
            </template>
          </DiffEditor>

          <DiffTreeView v-else />
        </div>
      </div>

      <!-- Right Sidebar: Summary & Navigation -->
      <div class="w-80 flex flex-col bg-sidebar shrink-0 overflow-hidden border-l border-base">
        <div class="p-4 border-b border-base bg-secondary">
          <h2 class="text-xs font-bold uppercase tracking-wider text-muted">Comparison Summary</h2>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <DiffSummary :diff-result="diffStore.diffResult" />

          <div v-if="viewMode === 'editor'" class="p-4 border-t border-base">
            <h3 class="text-[10px] font-bold uppercase text-muted mb-3">Changes List</h3>


            <div class="space-y-1">
              <button
                v-for="(change, index) in filteredChanges"
                :key="index"
                class="w-full text-left px-2 py-1.5 rounded text-[10px] font-mono truncate hover:bg-gray-200 dark:hover:bg-[#2d2d2d] transition-colors flex items-center gap-2"
                :class="{ 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': diffStore.currentChangeIndex === index }"
                @click="handleSelectChange(index)"
              >
                <div
                  class="w-2 h-2 rounded-full shrink-0"
                  :class="[
                    change.type === 'added' ? 'bg-green-500' :
                    change.type === 'removed' ? 'bg-red-500' :
                    'bg-amber-500'
                  ]"
                />
                <span class="truncate">{{ change.path }}</span>
              </button>

              <button
                v-if="isChangesCapped"
                class="w-full py-2 text-[10px] font-bold uppercase text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                @click="loadMore"
              >
                Load more changes ({{ filteredChangesAll.length - displayLimit }} left)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import DiffEditor from '@/components/Editor/DiffEditor.vue';
import DiffTreeView from '@/components/TreeView/DiffTreeView.vue';
import DiffSummary from '@/components/TreeView/DiffSummary.vue';
import { useDiffStore } from '@/stores/diffStore';
import FileUtils from '@/utils/file-utils';
import useClipboard from '@/composables/useClipboard';

const diffStore = useDiffStore();
const { showToast } = useClipboard();

const viewMode = ref<'editor' | 'tree'>('editor');

const leftFileInput = ref<HTMLInputElement | null>(null);
const rightFileInput = ref<HTMLInputElement | null>(null);

const INITIAL_LOAD = 20;
const displayLimit = ref(INITIAL_LOAD);

const filteredChangesAll = computed(() => {
  if (!diffStore.diffResult) return [];
  return diffStore.diffResult.changes.filter(c => c.type !== 'unchanged');
});

const isChangesCapped = computed(() => displayLimit.value < filteredChangesAll.value.length);

const filteredChanges = computed(() => {
  return filteredChangesAll.value.slice(0, displayLimit.value);
});

const loadMore = () => {
  displayLimit.value += 50;
};

const handleSelectChange = (index: number) => {
  diffStore.currentChangeIndex = index;
};

const triggerLeftImport = () => {
  leftFileInput.value?.click();
};

const triggerRightImport = () => {
  rightFileInput.value?.click();
};

const onLeftFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    try {
      const content = await FileUtils.readFile(file);
      const format = FileUtils.getFormatByExtension(file.name);
      if (format) diffStore.setLeftFormat(format);
      diffStore.setLeftRaw(content);
      showToast(`File "${file.name}" imported to Source A`, 'success');
    } catch (error) {
      showToast('Failed to read file', 'error');
    } finally {
      target.value = '';
    }
  }
};

const onRightFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    try {
      const content = await FileUtils.readFile(file);
      const format = FileUtils.getFormatByExtension(file.name);
      if (format) diffStore.setRightFormat(format);
      diffStore.setRightRaw(content);
      showToast(`File "${file.name}" imported to Source B`, 'success');
    } catch (error) {
      showToast('Failed to read file', 'error');
    } finally {
      target.value = '';
    }
  }
};

// Reset display limit when diff changes
watch(() => diffStore.diffResult, () => {
  displayLimit.value = INITIAL_LOAD;
});
</script>

<style scoped>
.cursor-col-resize {
  z-index: 10;
}
</style>
