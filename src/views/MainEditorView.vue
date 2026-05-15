<template>
  <AppShell ref="appShell">
    <template #editor>
      <section class="flex flex-col h-full min-h-0 border-r border-base lg:border-none">
        <div class="px-4 h-10 border-b border-light flex items-center bg-secondary justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-muted">{{ t(activeMode.inputLabelKey) }}</span>
        </div>
        <div class="flex-1 bg-base relative min-h-0">
          <CodeEditor />
        </div>
      </section>
    </template>

    <template #tree>
      <section class="flex flex-col h-full min-h-0">
        <div class="px-4 h-10 border-b border-light flex items-center bg-secondary justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-muted">{{ t(activeMode.outputLabelKey) }}</span>
          <div class="flex items-center gap-2">
            <div
              v-if="activeMode.id !== 'transform'"
              class="hidden sm:flex items-center gap-1 border-r border-base pr-2"
            >
              <span class="text-[10px] font-bold uppercase text-light">{{ t('tree.depth') }}</span>
              <button
                v-for="depth in depthOptions"
                :key="depth.label"
                class="min-w-6 px-1.5 py-1 rounded text-[10px] font-bold text-muted hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] transition-colors disabled:opacity-30"
                :disabled="!documentStore.parsedData"
                :title="t('tree.expandDepth', { depth: depthLabel(depth) })"
                @click="expandToDepth(depth.value)"
                v-tooltip="t('tree.expandDepth', { depth: depthLabel(depth) })"
              >
                {{ depthLabel(depth) }}
              </button>
            </div>
            <button
              v-if="activeMode.id !== 'compare' && isCompactRightSidebar"
              class="p-2 md:p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors text-muted"
              :title="t('common.sidePanels')"
              @click="toggleInspectToolsPanel"
              v-tooltip="t('common.sidePanels')"
            >
              <div class="i-carbon-data-view-alt text-base md:text-sm" />
            </button>
            <button
              v-if="activeMode.id !== 'transform'"
              class="p-2 md:p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors disabled:opacity-30 text-muted"
              :title="t('common.expandAll')"
              :disabled="!documentStore.parsedData"
              @click="expandToDepth('all')"
              v-tooltip="t('common.expandAll')"
            >
              <div class="i-material-symbols-expand-all text-base md:text-sm" />
            </button>
            <button
              v-if="activeMode.id !== 'transform'"
              class="p-2 md:p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors disabled:opacity-30 text-muted"
              :title="t('common.collapseAll')"
              :disabled="!documentStore.parsedData"
              @click="collapseAll"
              v-tooltip="t('common.collapseAll')"
            >
              <div class="i-material-symbols-collapse-all text-base md:text-sm" />
            </button>
          </div>
        </div>
        <div class="flex-1 min-h-0 overflow-hidden">
          <TransformWorkspace v-if="activeMode.id === 'transform'" />
          <VirtualTreeView v-else />
        </div>
      </section>
    </template>

    <template #right-sidebar>
      <RightSidebar />
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/Layout/AppShell.vue'
import VirtualTreeView from '@/components/TreeView/VirtualTreeView.vue'
import TransformWorkspace from '@/components/Transform/TransformWorkspace.vue'
import RightSidebar from '@/components/Layout/RightSidebar.vue'
import { useDocumentStore } from '@/stores/documentStore'
import { useTreeStore } from '@/stores/treeStore'
import { useDiffStore } from '@/stores/diffStore'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getProductModeByPath } from '@/config/product-modes'
import { collectExpandablePaths, type TExpandDepth } from '@/utils/tree-node-utils'
import { useBreakpoints } from '@/composables/useBreakpoints'
import useI18n from '@/composables/useI18n'

const documentStore = useDocumentStore()
const treeStore = useTreeStore()
const diffStore = useDiffStore()
const route = useRoute()
const { width } = useBreakpoints()
const { t } = useI18n()
const appShell = ref<{ toggleInspectTools: () => void } | null>(null)
const activeMode = computed(() => getProductModeByPath(route.path))
const isCompactRightSidebar = computed(() => width.value < 1280)
const CodeEditor = defineAsyncComponent(() => import('@/components/Editor/CodeEditor.vue'))
const depthOptions: Array<{ label: string, value: TExpandDepth }> = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: 'all', value: 'all' },
]

const depthLabel = (depth: { label: string, value: TExpandDepth }) => {
  return depth.value === 'all' ? t('common.all') : depth.label
}

onMounted(() => {
  diffStore.setMode('normal')
})

const expandToDepth = (depth: TExpandDepth) => {
  if (documentStore.parsedData) {
    treeStore.expandAll(collectExpandablePaths(documentStore.parsedData, depth))
  }
}

const collapseAll = () => {
  treeStore.collapseAll()
}

const toggleInspectToolsPanel = () => {
  appShell.value?.toggleInspectTools()
}
</script>
