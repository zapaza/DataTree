<template>
  <div class="flex flex-col h-full bg-sidebar border-l border-base">
    <div class="flex border-b border-base bg-base">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex-1 flex flex-col items-center py-2 gap-1 transition-colors"
        :class="activeTab === tab.id ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-light hover:text-muted'"
        @click="setActiveTab(tab.id)"
      >
        <div :class="tab.icon" class="text-lg" />
        <span class="text-[10px] font-medium uppercase">{{ tab.label }}</span>
      </button>
    </div>

    <div class="flex-1 overflow-auto">
      <DocumentStatsPanel v-if="activeTab === 'stats'" />

      <SmartInsightsPanel v-else-if="activeTab === 'insights'" />

      <QueryExtractPanel v-else-if="activeTab === 'query'" />

      <ContractPanel v-else-if="activeTab === 'validation'" />

      <TransformPanel v-else-if="activeTab === 'transform'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import SmartInsightsPanel from '@/components/Sidebar/SmartInsightsPanel.vue';
import QueryExtractPanel from '@/components/Sidebar/QueryExtractPanel.vue';
import DocumentStatsPanel from '@/components/RightSidebar/DocumentStatsPanel.vue';
import ContractPanel from '@/components/RightSidebar/ContractPanel.vue';
import TransformPanel from '@/components/Transform/TransformPanel.vue';
import useI18n from '@/composables/useI18n';

type TRightSidebarTabId = 'stats' | 'insights' | 'query' | 'validation' | 'transform';

const route = useRoute();
const { t } = useI18n();
const activeTab = ref<TRightSidebarTabId>(route.path === '/validate' ? 'validation' : route.path === '/transform' ? 'transform' : 'stats');

const tabs = computed<Array<{ id: TRightSidebarTabId; icon: string; label: string }>>(() => {
  if (route.path === '/transform') {
    return [
      { id: 'transform', icon: 'i-carbon-arrows-horizontal', label: t('sidebar.tabs.tools') },
      { id: 'stats', icon: 'i-carbon-chart-bar', label: t('sidebar.tabs.stats') },
      { id: 'validation', icon: 'i-carbon-rule', label: t('sidebar.tabs.schema') },
    ];
  }

  return [
    { id: 'stats', icon: 'i-carbon-chart-bar', label: t('sidebar.tabs.stats') },
    { id: 'insights', icon: 'i-carbon-ai-status', label: t('sidebar.tabs.insights') },
    { id: 'query', icon: 'i-carbon-query', label: t('sidebar.tabs.query') },
    { id: 'validation', icon: 'i-carbon-rule', label: t('sidebar.tabs.schema') },
  ];
});

const setActiveTab = (tabId: TRightSidebarTabId) => {
  activeTab.value = tabId;
};

watch(() => route.path, (path) => {
  activeTab.value = path === '/validate' ? 'validation' : path === '/transform' ? 'transform' : 'stats';
});
</script>
