<template>
  <AppShell>
    <template #editor>
      <section class="flex flex-col h-full min-h-0 border-r border-base lg:border-none">
        <div class="px-4 h-10 border-b border-light flex items-center bg-secondary justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-muted">Editor</span>
        </div>
        <div class="flex-1 bg-base relative min-h-0">
          <CodeEditor />
        </div>
      </section>
    </template>

    <template #tree>
      <section class="flex flex-col h-full min-h-0">
        <div class="px-4 h-10 border-b border-light flex items-center bg-secondary justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-muted">Visualizer</span>
          <div class="flex gap-2">
            <button
              class="p-2 md:p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors disabled:opacity-30 text-muted"
              title="Expand All"
              :disabled="!appStore.parsedData"
              @click="expandAll"
              v-tooltip="'Expand All'"
            >
              <div class="i-material-symbols-expand-all text-base md:text-sm" />
            </button>
            <button
              class="p-2 md:p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors disabled:opacity-30 text-muted"
              title="Collapse All"
              :disabled="!appStore.parsedData"
              @click="collapseAll"
              v-tooltip="'Collapse All'"
            >
              <div class="i-material-symbols-collapse-all text-base md:text-sm" />
            </button>
          </div>
        </div>
        <div class="flex-1 min-h-0 overflow-hidden">
          <VirtualTreeView />
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
import CodeEditor from '@/components/Editor/CodeEditor.vue'
import VirtualTreeView from '@/components/TreeView/VirtualTreeView.vue'
import RightSidebar from '@/components/Layout/RightSidebar.vue'
import { useAppStore } from '@/stores/appStore'
import { useTreeStore } from '@/stores/treeStore'
import { useDiffStore } from '@/stores/diffStore'
import { onMounted } from 'vue'

const appStore = useAppStore()
const treeStore = useTreeStore()
const diffStore = useDiffStore()

onMounted(() => {
  diffStore.setMode('normal')
})

const expandAll = () => {
  if (appStore.parsedData) {
    const getAllPaths = (node: any, currentPath: string = 'root', paths: string[] = []): string[] => {
      paths.push(currentPath)
      if (node.children) {
        node.children.forEach((child: any) => {
          getAllPaths(child, `${currentPath}.${child.key}`, paths)
        })
      }
      return paths
    }
    const allPaths = getAllPaths(appStore.parsedData)
    treeStore.expandAll(allPaths)
  }
}

const collapseAll = () => {
  treeStore.collapseAll()
}
</script>
