<template>
  <MainLayout>
    <template #header>
      <TheHeader @toggle-menu="showMobileMenu = true" />
    </template>

    <template #sidebar>
      <div class="flex h-full">
        <TheSidebar
          @toggle-examples="toggleExamples"
          @toggle-history="toggleHistory"
          @toggle-settings="toggleSettings"
        />
        <Transition name="slide">
          <ExamplesPanel v-if="showExamples" @close="showExamples = false" />
        </Transition>
        <Transition name="slide">
          <HistoryPanel v-if="showHistory" @close="showHistory = false" />
        </Transition>
        <Transition name="slide">
          <SettingsPanel v-if="showSettings" @close="showSettings = false" />
        </Transition>
      </div>
    </template>

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
              v-tooltip="'Expand All'"
              :disabled="!appStore.parsedData"
              @click="expandAll"
            >
              <div class="i-material-symbols-expand-all text-base md:text-sm" />
            </button>
            <button
              class="p-2 md:p-1 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] rounded transition-colors disabled:opacity-30 text-muted"
              title="Collapse All"
              v-tooltip="'Collapse All'"
              :disabled="!appStore.parsedData"
              @click="collapseAll"
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
  </MainLayout>

  <!-- Mobile Menu -->
  <Transition name="fade">
    <MobileMenu
      v-if="showMobileMenu"
      @close="showMobileMenu = false"
      @toggle-examples="toggleExamples"
      @toggle-history="toggleHistory"
      @toggle-settings="toggleSettings"
      @toggle-theme="settingsStore.toggleTheme"
    />
  </Transition>

  <!-- Panels for mobile -->
  <div v-if="isMobile" class="fixed inset-0 z-[110] pointer-events-none">
    <Transition name="slide">
      <div v-if="showExamples" class="pointer-events-auto h-full w-full max-w-sm bg-base shadow-2xl overflow-hidden">
         <ExamplesPanel @close="showExamples = false" />
      </div>
    </Transition>
    <Transition name="slide">
      <div v-if="showHistory" class="pointer-events-auto h-full w-full max-w-sm bg-base shadow-2xl overflow-hidden">
         <HistoryPanel @close="showHistory = false" />
      </div>
    </Transition>
    <Transition name="slide">
      <div v-if="showSettings" class="pointer-events-auto h-full w-full max-w-sm bg-base shadow-2xl overflow-hidden">
         <SettingsPanel @close="showSettings = false" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import MainLayout from '@/components/Layout/MainLayout.vue'
import TheHeader from '@/components/Layout/TheHeader.vue'
import TheSidebar from '@/components/Layout/TheSidebar.vue'
import RightSidebar from '@/components/Layout/RightSidebar.vue'
import CodeEditor from '@/components/Editor/CodeEditor.vue'
import VirtualTreeView from '@/components/TreeView/VirtualTreeView.vue'
import ExamplesPanel from '@/components/Sidebar/ExamplesPanel.vue'
import HistoryPanel from '@/components/Sidebar/HistoryPanel.vue'
import SettingsPanel from '@/components/Sidebar/SettingsPanel.vue'
import MobileMenu from '@/components/Mobile/MobileMenu.vue'
import { useTreeStore } from '@/stores/treeStore'
import { useAppStore } from '@/stores/appStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { ref, onMounted } from 'vue'
import { useBreakpoints } from '@/composables/useBreakpoints'
import useAnalytics from '@/composables/useAnalytics'

const treeStore = useTreeStore()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const { isMobile } = useBreakpoints()
const { trackPageView, trackEvent } = useAnalytics()

const showExamples = ref(false)
const showHistory = ref(false)
const showSettings = ref(false)
const showMobileMenu = ref(false)

onMounted(() => {
  trackPageView(window.location.pathname)
})

const toggleExamples = () => {
  showExamples.value = !showExamples.value
  showHistory.value = false
  showSettings.value = false
  if (showExamples.value) trackEvent('panel_open', { name: 'examples' })
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
  showExamples.value = false
  showSettings.value = false
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
  showExamples.value = false
  showHistory.value = false
}

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

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
