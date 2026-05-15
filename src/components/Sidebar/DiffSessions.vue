<template>
  <div class="p-4 space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-bold uppercase text-light tracking-wider flex items-center gap-2">
        <div class="i-carbon-save" />
        {{ t('compare.sessions.title') }}
      </h3>

      <div class="flex items-center gap-2">
        <div v-if="diffStore.isSaving" class="text-[10px] text-muted font-bold uppercase flex items-center gap-1">
          <div class="i-carbon-circle-dash animate-spin" />
          {{ t('compare.sessions.saving') }}
        </div>
        <div v-else-if="diffStore.lastSavedAt" class="text-[10px] text-light font-mono">
          {{ t('compare.sessions.saved') }}
        </div>
      </div>
    </div>

    <div class="flex gap-2">
      <button
        class="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-base border border-base hover:bg-secondary text-muted rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm"
        @click="handleSaveAsNew"
      >
        <div class="i-carbon-add" />
        {{ t('compare.sessions.saveAsNew') }}
      </button>
      <button
        class="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-base border border-base hover:bg-secondary text-muted rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm"
        @click="triggerImport"
      >
        <div class="i-carbon-document-import" />
        {{ t('common.import') }}
      </button>
      <input ref="importInput" type="file" accept=".json" class="hidden" @change="handleImport" />
    </div>

    <div v-if="isLoading" class="py-6 text-center text-light">
      <div class="i-carbon-progress-bar-round animate-spin text-2xl mb-2" />
      <p class="text-xs">{{ t('compare.sessions.loading') }}</p>
    </div>

    <div v-else-if="sessions.length === 0" class="py-6 text-center text-light">
      <div class="i-carbon-time text-3xl mb-2 opacity-20" />
      <p class="text-xs italic">{{ t('compare.sessions.none') }}</p>
      <p class="text-[10px] mt-2">{{ t('compare.sessions.hint') }}</p>
    </div>

    <div v-else class="space-y-2">
      <button
        v-for="s in sessions"
        :key="s.id"
        class="w-full text-left p-3 rounded-xl border border-light hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group relative cursor-pointer bg-base shadow-sm"
        :class="diffStore.activeSessionId === s.id ? 'ring-1 ring-blue-400/40' : ''"
        @click="loadSession(s.id)"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-bold text-light uppercase tracking-tight">
            {{ formatDate(s.updatedAt) }}
          </span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted font-mono uppercase border border-light">
            {{ formatBytes(s.sizeBytes) }}
          </span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs text-base font-medium truncate">
            {{ s.title }}
          </p>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-muted"
              :title="t('common.export')"
              @click.stop="exportSession(s.id)"
            >
              <div class="i-carbon-download text-sm" />
            </button>
            <button
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2d2d2d] text-muted"
              :title="t('common.rename')"
              @click.stop="renameSession(s.id, s.title)"
            >
              <div class="i-carbon-edit text-sm" />
            </button>
            <button
              class="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 text-light hover:text-red-600"
              :title="t('common.delete')"
              @click.stop="deleteSession(s.id)"
            >
              <div class="i-carbon-trash-can text-sm" />
            </button>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDiffStore } from '@/stores/diffStore'
import useClipboard from '@/composables/useClipboard'
import { diffSessionsDB, type TDiffSession } from '@/utils/indexeddb/diff-sessions-db'
import useI18n from '@/composables/useI18n'

const diffStore = useDiffStore()
const { showToast } = useClipboard()
const { locale, t } = useI18n()

const isLoading = ref(false)
const sessions = ref<TDiffSession[]>([])
const importInput = ref<HTMLInputElement | null>(null)

const refresh = async () => {
  isLoading.value = true
  try {
    sessions.value = await diffSessionsDB.listSessions(100)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  refresh().catch(() => {})
})

const formatDate = (ts: number) => {
  return new Intl.DateTimeFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0B'
  const units = ['B', 'KB', 'MB', 'GB']
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(i === 0 ? 0 : 1)}${units[i]}`
}

const loadSession = async (id: string) => {
  await diffStore.restoreSession(id)
  showToast(t('toast.sessionLoaded'), 'success')
  await refresh()
}

const handleSaveAsNew = async () => {
  await diffStore.saveSessionNow({ forceNew: true, title: `Diff Session ${new Date().toISOString().slice(0, 16).replace('T', ' ')}` })
  showToast(t('toast.sessionSaved'), 'success')
  await refresh()
}

const deleteSession = async (id: string) => {
  if (!confirm(t('compare.sessions.deleteConfirm'))) return
  await diffSessionsDB.deleteSession(id)
  showToast(t('toast.sessionDeleted'), 'info')
  await refresh()
}

const renameSession = async (id: string, currentTitle: string) => {
  const title = prompt(t('compare.sessions.titlePrompt'), currentTitle)?.trim()
  if (!title) return
  const session = await diffSessionsDB.getSession(id)
  if (!session) return
  session.title = title
  session.updatedAt = Date.now()
  await diffSessionsDB.upsertSession(session)
  showToast(t('toast.sessionRenamed'), 'success')
  await refresh()
}

const exportSession = async (id: string) => {
  const session = await diffSessionsDB.getSession(id)
  if (!session) return
  const blob = new Blob([JSON.stringify({ version: 1, type: 'diff-session', session }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `datatree-diff-session-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast(t('toast.sessionExported'), 'success')
}

const triggerImport = () => importInput.value?.click()

const handleImport = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    if (parsed?.type !== 'diff-session' || !parsed?.session) {
      showToast(t('toast.invalidSession'), 'error')
      return
    }
    const session = parsed.session as TDiffSession
    // Always import as new ID to avoid overwriting existing sessions
    session.id = `import_${Date.now()}_${Math.random().toString(16).slice(2)}`
    session.createdAt = Date.now()
    session.updatedAt = Date.now()
    await diffSessionsDB.upsertSession(session)
    showToast(t('toast.sessionImported'), 'success')
    await refresh()
  } catch {
    showToast(t('toast.sessionImportFailed'), 'error')
  } finally {
    input.value = ''
  }
}
</script>
