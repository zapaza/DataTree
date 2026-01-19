<template>
  <AppShell>
    <template #content>
      <DiffLayout />
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '@/components/Layout/AppShell.vue'
import DiffLayout from '@/components/Layout/DiffLayout.vue'
import { useDiffStore } from '@/stores/diffStore'
import { onMounted } from 'vue'

const diffStore = useDiffStore()

onMounted(() => {
  diffStore.setMode('diff')
  diffStore.initPersistence()
})
</script>
