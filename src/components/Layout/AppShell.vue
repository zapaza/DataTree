<template>
  <div class="app-shell flex flex-col h-full overflow-hidden">
    <MainLayout>
      <template #header>
        <TheHeader @toggle-menu="showMobileMenu = true" />
      </template>

      <template #sidebar>
        <div class="flex h-full">
          <TheSidebar
            @toggle-history="toggleHistory"
            @toggle-settings="toggleSettings"
          />
          <Transition name="slide">
            <HistoryPanel v-if="showHistory" @close="showHistory = false" />
          </Transition>
          <Transition name="slide">
            <SettingsPanel v-if="showSettings" @close="showSettings = false" />
          </Transition>
        </div>
      </template>

      <!-- Content Slots -->
      <template v-if="$slots.content" #content>
        <slot name="content" />
      </template>

      <template v-if="$slots.editor" #editor>
        <slot name="editor" />
      </template>

      <template v-if="$slots.tree" #tree>
        <slot name="tree" />
      </template>

      <template #right-sidebar>
        <slot name="right-sidebar" />
      </template>
    </MainLayout>

    <!-- Mobile Menu -->
    <Transition name="fade">
      <MobileMenu
        v-if="showMobileMenu"
        @close="showMobileMenu = false"
        @toggle-examples="toggleExamples"
        @toggle-inspect-tools="toggleInspectTools"
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
        <div v-if="showInspectTools" class="pointer-events-auto h-full w-full max-w-sm bg-base shadow-2xl overflow-hidden">
          <div class="h-10 px-3 border-b border-base bg-base flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-muted">{{ t('common.sidePanels') }}</span>
            <button
              class="p-1.5 rounded hover:bg-secondary text-light hover:text-muted transition-colors"
              :aria-label="t('common.close')"
              @click="showInspectTools = false"
            >
              <div class="i-carbon-close text-lg" />
            </button>
          </div>
          <div class="h-[calc(100%-2.5rem)] overflow-hidden">
            <slot name="right-sidebar" />
          </div>
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

    <Transition name="fade">
      <div
        v-if="!isMobile && isCompactRightSidebar && showInspectTools"
        class="fixed inset-0 z-[110] flex justify-end bg-black/20 backdrop-blur-[1px]"
        @click.self="showInspectTools = false"
      >
        <div class="h-full w-full max-w-sm bg-base shadow-2xl overflow-hidden">
          <div class="h-10 px-3 border-b border-base bg-base flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-muted">{{ t('common.sidePanels') }}</span>
            <button
              class="p-1.5 rounded hover:bg-secondary text-light hover:text-muted transition-colors"
              :aria-label="t('common.close')"
              @click="showInspectTools = false"
            >
              <div class="i-carbon-close text-lg" />
            </button>
          </div>
          <div class="h-[calc(100%-2.5rem)] overflow-hidden">
            <slot name="right-sidebar" />
          </div>
        </div>
      </div>
    </Transition>

    <CommandPalette />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import MainLayout from '@/components/Layout/MainLayout.vue'
import TheHeader from '@/components/Layout/TheHeader.vue'
import TheSidebar from '@/components/Layout/TheSidebar.vue'
import ExamplesPanel from '@/components/Sidebar/ExamplesPanel.vue'
import HistoryPanel from '@/components/Sidebar/HistoryPanel.vue'
import SettingsPanel from '@/components/Sidebar/SettingsPanel.vue'
import MobileMenu from '@/components/Mobile/MobileMenu.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useBreakpoints } from '@/composables/useBreakpoints'
import useAnalytics from '@/composables/useAnalytics'
import useI18n from '@/composables/useI18n'

const settingsStore = useSettingsStore()
const { isMobile, width } = useBreakpoints()
const { trackPageView, trackEvent } = useAnalytics()
const { t } = useI18n()
const isCompactRightSidebar = computed(() => width.value < 1280)

const showExamples = ref(false)
const showInspectTools = ref(false)
const showHistory = ref(false)
const showSettings = ref(false)
const showMobileMenu = ref(false)

onMounted(() => {
  trackPageView(window.location.pathname)
})

const toggleExamples = () => {
  showExamples.value = !showExamples.value
  showInspectTools.value = false
  showHistory.value = false
  showSettings.value = false
  if (showExamples.value) trackEvent('panel_open', { name: 'examples' })
}

const toggleInspectTools = () => {
  showInspectTools.value = !showInspectTools.value
  showExamples.value = false
  showHistory.value = false
  showSettings.value = false
  if (showInspectTools.value) trackEvent('panel_open', { name: 'inspect_tools' })
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
  showExamples.value = false
  showInspectTools.value = false
  showSettings.value = false
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
  showExamples.value = false
  showInspectTools.value = false
  showHistory.value = false
}

defineExpose({ toggleInspectTools })
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
