import { defineStore } from 'pinia';
import { ref, watch, toRaw } from 'vue';
import SafeJsonParser from '@/utils/parsers/json-parser';
import XmlParser from '@/utils/parsers/xml-parser';
import diffJson from '@/utils/diff-algorithms/json-diff';
import buildDiffTree from '@/utils/diff-algorithms/diff-tree-builder';
import debounce from '@/utils/debounce';
import type { TDataType, IParseResult } from '@/types/editor';
import type { TDiffResult, TDiffTreeNode } from '@/types/diff';
import { diffSessionsDB, type TDiffSession, type TDiffSessionId } from '@/utils/indexeddb/diff-sessions-db';
import { useSettingsStore } from '@/stores/settingsStore';

export type TDiffMode = 'normal' | 'diff';

/**
 * Store for managing JSON/XML comparison (diff) state.
 */
export const useDiffStore = defineStore('diff', () => {
  const mode = ref<TDiffMode>('normal');
  const settingsStore = useSettingsStore();

  const left = ref({
    raw: '',
    format: 'json' as TDataType,
    parsed: null as any,
    valid: true,
    error: null as any
  });

  const right = ref({
    raw: '',
    format: 'json' as TDataType,
    parsed: null as any,
    valid: true,
    error: null as any
  });

  const diffResult = ref<TDiffResult | null>(null);
  const diffTree = ref<TDiffTreeNode | null>(null);
  const isComputingDiff = ref(false);
  const diffComputeTime = ref(0);
  const diffError = ref<string | null>(null);

  // Persistence (IndexedDB)
  const activeSessionId = ref<TDiffSessionId | null>(null);
  const isRestoring = ref(false);
  const isSaving = ref(false);
  const lastSavedAt = ref<number | null>(null);
  const lastSaveError = ref<string | null>(null);
  const lastLoadedAt = ref<number | null>(null);

  // Worker state (latest-wins)
  let diffWorker: Worker | null = null;
  let diffRequestId = 0;

  // Heuristic: only offload to worker for sufficiently large inputs (avoid overhead on tiny diffs)
  const DIFF_WORKER_THRESHOLD_CHARS = 300_000;

  // Состояние отображения
  const showOnlyChanges = ref(false);
  const currentChangeIndex = ref(-1);

  const getRetentionDays = () => (settingsStore.settings as any)?.diffPersistence?.retentionDays ?? 30;
  const getMaxSessions = () => (settingsStore.settings as any)?.diffPersistence?.maxSessions ?? 100;

  /**
   * Universal parsing function
   */
  const parseContent = (content: string, format: TDataType): IParseResult => {
    if (format === 'json') {
      return SafeJsonParser.parse(content);
    } else {
      return XmlParser.parse(content);
    }
  };

  /**
   * Sets the application mode (normal or diff).
   */
  const setMode = (newMode: TDiffMode) => {
    mode.value = newMode;
  };

  const generateSessionId = (): TDiffSessionId => {
    return `diff_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };

  const estimateSizeBytes = (obj: any): number => {
    try {
      const json = JSON.stringify(obj);
      return new Blob([json]).size;
    } catch {
      return 0;
    }
  };

  const buildSessionPayload = (): Omit<TDiffSession, 'id' | 'createdAt' | 'updatedAt' | 'title'> => {
    // Cache diff only if it's small enough (avoid exploding storage for huge diffs)
    let cachedDiffResult: any | null = null;
    let cachedDiffTree: any | null = null;

    if (diffResult.value && diffTree.value) {
      const size = estimateSizeBytes(diffResult.value);
      if (size > 0 && size < 2_000_000) {
        cachedDiffResult = diffResult.value;
        cachedDiffTree = diffTree.value;
      }
    }

    return {
      leftRaw: left.value.raw,
      rightRaw: right.value.raw,
      leftFormat: left.value.format,
      rightFormat: right.value.format,
      showOnlyChanges: showOnlyChanges.value,
      diffResult: cachedDiffResult,
      diffTree: cachedDiffTree,
      sizeBytes: 0, // computed in save
    };
  };

  const saveSessionNow = async (opts?: { title?: string; forceNew?: boolean }) => {
    if (mode.value !== 'diff') return;
    if (!left.value.raw && !right.value.raw) return;

    isSaving.value = true;
    lastSaveError.value = null;

    try {
      const now = Date.now();
      const payload = buildSessionPayload();
      const id = (opts?.forceNew || !activeSessionId.value) ? generateSessionId() : activeSessionId.value;

      const existing = id ? await diffSessionsDB.getSession(id) : null;
      const session: TDiffSession = {
        id,
        title: opts?.title || existing?.title || 'Diff Session',
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        ...payload,
        sizeBytes: 0,
      };
      session.sizeBytes = estimateSizeBytes(session);

      await diffSessionsDB.upsertSession(session);
      await diffSessionsDB.setMeta('diff_active_session_id', id);
      activeSessionId.value = id;

      // Auto backup (best effort, every ~5 minutes)
      const latestBackup = await diffSessionsDB.getLatestBackup(id);
      if (!latestBackup || now - latestBackup.createdAt > 5 * 60 * 1000) {
        await diffSessionsDB.createBackup({
          id: `backup_${now}_${Math.random().toString(16).slice(2)}`,
          sessionId: id,
          createdAt: now,
          payload,
          sizeBytes: estimateSizeBytes(payload),
        });
      }

      // GC policies
      await diffSessionsDB.garbageCollect({
        retentionDays: getRetentionDays(),
        maxSessions: getMaxSessions(),
        maxTotalBytes: 50 * 1024 * 1024,
      });

      lastSavedAt.value = now;
    } catch (e: any) {
      lastSaveError.value = e?.message || 'Failed to save session';
    } finally {
      isSaving.value = false;
    }
  };

  const debouncedSaveSession = debounce(() => {
    saveSessionNow().catch(() => {});
  }, 1000);

  const restoreSession = async (id: TDiffSessionId) => {
    isRestoring.value = true;
    try {
      const session = await diffSessionsDB.getSession(id);
      if (!session) return;

      activeSessionId.value = id;
      await diffSessionsDB.setMeta('diff_active_session_id', id);

      left.value.format = session.leftFormat;
      right.value.format = session.rightFormat;
      left.value.raw = session.leftRaw;
      right.value.raw = session.rightRaw;
      showOnlyChanges.value = session.showOnlyChanges;

      // If cached diff is present, restore immediately; otherwise compute in background via watchers
      diffResult.value = (session.diffResult as any) || null;
      diffTree.value = (session.diffTree as any) || null;

      updateValidation();
      computeDiff();
      lastLoadedAt.value = Date.now();
    } finally {
      isRestoring.value = false;
    }
  };

  const initPersistence = async () => {
    if (mode.value !== 'diff') return;
    try {
      await diffSessionsDB.garbageCollect({
        retentionDays: getRetentionDays(),
        maxSessions: getMaxSessions(),
        maxTotalBytes: 50 * 1024 * 1024,
      });

      const lastId = await diffSessionsDB.getMeta<TDiffSessionId>('diff_active_session_id');
      if (lastId) {
        await restoreSession(lastId);
      }
    } catch {
      // ignore init failures; user can still work without persistence
    }
  };

  /**
   * Updates the raw input for the left panel.
   */
  const setLeftRaw = (raw: string) => {
    left.value.raw = raw;
  };

  /**
   * Updates the raw input for the right panel.
   */
  const setRightRaw = (raw: string) => {
    right.value.raw = raw;
  };

  /**
   * Updates format for the panels
   */
  const setLeftFormat = (format: TDataType) => {
    left.value.format = format;
  };

  const setRightFormat = (format: TDataType) => {
    right.value.format = format;
  };

  /**
   * Updates validation state for all panels.
   */
  const updateValidation = () => {
    const leftRes = parseContent(left.value.raw, left.value.format);
    const rightRes = parseContent(right.value.raw, right.value.format);

    left.value.valid = leftRes.success;
    right.value.valid = rightRes.success;

    left.value.error = leftRes.error || null;
    right.value.error = rightRes.error || null;

    left.value.parsed = leftRes.success ? leftRes.data : null;
    right.value.parsed = rightRes.success ? rightRes.data : null;

    return { leftRes, rightRes };
  };

  const diffCache = new Map<string, { result: TDiffResult, tree: TDiffTreeNode }>();

  /**
   * Performs JSON/XML comparison based on current raw inputs.
   */
  const computeDiff = () => {
    if (!left.value.raw || !right.value.raw) {
      diffResult.value = null;
      diffTree.value = null;
      diffError.value = null;
      isComputingDiff.value = false;
      return;
    }

    if (!left.value.valid || !right.value.valid || left.value.parsed === null || right.value.parsed === null) {
      diffResult.value = null;
      diffTree.value = null;
      diffError.value = null;
      isComputingDiff.value = false;
      return;
    }

    // Check cache first
    const cacheKey = `${left.value.raw.length}-${right.value.raw.length}-${left.value.raw.slice(0, 100)}-${right.value.raw.slice(0, 100)}`;
    const cached = diffCache.get(cacheKey);
    if (cached) {
      diffResult.value = cached.result;
      diffTree.value = cached.tree;
      isComputingDiff.value = false;
      return;
    }

    const maxLen = Math.max(left.value.raw.length, right.value.raw.length);
    const shouldUseWorker = maxLen >= DIFF_WORKER_THRESHOLD_CHARS;

    // Small diffs: keep synchronous for snappier feel
    if (!shouldUseWorker) {
      try {
        isComputingDiff.value = false;
        diffError.value = null;
        diffComputeTime.value = 0;

        const result = diffJson(left.value.parsed, right.value.parsed);
        const tree = buildDiffTree(left.value.parsed, right.value.parsed);

        diffResult.value = result;
        diffTree.value = tree;
        currentChangeIndex.value = -1;

        diffCache.set(cacheKey, { result, tree });
      } catch (e: any) {
        console.error('Failed to compute diff:', e);
        diffError.value = e?.message || 'Failed to compute diff';
        diffResult.value = null;
        diffTree.value = null;
      }
      return;
    }

    // Large diffs: compute in a Web Worker, ensure only latest request applies
    isComputingDiff.value = true;
    diffError.value = null;
    const requestId = ++diffRequestId;

    if (diffWorker) {
      diffWorker.terminate();
      diffWorker = null;
    }

    diffWorker = new Worker(new URL('../workers/diff.worker.ts', import.meta.url), {
      type: 'module',
    });

    diffWorker.onmessage = (e) => {
      const { id, success, diffResult: result, diffTree: tree, computeTime, error } = e.data || {};
      if (id !== requestId) {
        return;
      }

      diffComputeTime.value = computeTime || 0;
      if (success) {
        diffResult.value = result;
        diffTree.value = tree;
        currentChangeIndex.value = -1;
        diffCache.set(cacheKey, { result, tree });
      } else {
        diffError.value = error?.message || 'Failed to compute diff';
        diffResult.value = null;
        diffTree.value = null;
      }
      isComputingDiff.value = false;
      diffWorker?.terminate();
      diffWorker = null;
    };

    diffWorker.onerror = (e) => {
      if (requestId !== diffRequestId) return;
      console.error('Diff worker error:', e);
      diffError.value = 'Diff worker error';
      diffResult.value = null;
      diffTree.value = null;
      isComputingDiff.value = false;
      diffWorker?.terminate();
      diffWorker = null;
    };

    // `left.value.parsed` and `right.value.parsed` can be Vue reactive proxies.
    // Proxies are not structured-cloneable, so unwrap them before posting.
    const leftParsed = toRaw(left.value.parsed);
    const rightParsed = toRaw(right.value.parsed);

    diffWorker.postMessage({
      id: requestId,
      left: leftParsed,
      right: rightParsed,
    });
  };

  const debouncedComputeDiff = debounce(computeDiff, 400);

  const nextChange = () => {
    if (!diffResult.value || diffResult.value.changes.length === 0) return;
    const changesOnly = diffResult.value.changes.filter(c => c.type !== 'unchanged');
    if (changesOnly.length === 0) return;

    currentChangeIndex.value = (currentChangeIndex.value + 1) % changesOnly.length;
    const change = changesOnly[currentChangeIndex.value];
    return change ? change.path : undefined;
  };

  const prevChange = () => {
    if (!diffResult.value || diffResult.value.changes.length === 0) return;
    const changesOnly = diffResult.value.changes.filter(c => c.type !== 'unchanged');
    if (changesOnly.length === 0) return;

    if (currentChangeIndex.value <= 0) {
      currentChangeIndex.value = changesOnly.length - 1;
    } else {
      currentChangeIndex.value--;
    }
    const change = changesOnly[currentChangeIndex.value];
    return change ? change.path : undefined;
  };

  // Automatically compute diff when inputs or formats change in diff mode
  watch([
    () => left.value.raw,
    () => right.value.raw,
    () => left.value.format,
    () => right.value.format,
    mode
  ], () => {
    if (mode.value === 'diff') {
      updateValidation();
      debouncedComputeDiff();
      debouncedSaveSession();
    }
  });

  return {
    mode,
    left,
    right,
    diffResult,
    diffTree,
    isComputingDiff,
    diffComputeTime,
    diffError,
    activeSessionId,
    isRestoring,
    isSaving,
    lastSavedAt,
    lastSaveError,
    lastLoadedAt,
    showOnlyChanges,
    currentChangeIndex,
    setMode,
    setLeftRaw,
    setRightRaw,
    setLeftFormat,
    setRightFormat,
    updateValidation,
    computeDiff,
    initPersistence,
    saveSessionNow,
    restoreSession,
    nextChange,
    prevChange
  };
});

export default useDiffStore;
