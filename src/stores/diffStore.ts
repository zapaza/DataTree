import { defineStore } from 'pinia';
import { markRaw, ref, shallowRef, watch, toRaw, type Ref } from 'vue';
import diffJson from '@/utils/diff-algorithms/json-diff';
import buildDiffTree from '@/utils/diff-algorithms/diff-tree-builder';
import { diffGeneratedContracts } from '@/utils/diff-algorithms/contract-diff';
import { DEFAULT_VOLATILE_KEYS, normalizeForDiff } from '@/utils/diff-algorithms/semantic-utils';
import debounce from '@/utils/debounce';
import type { TDataType, IParseResult } from '@/types/editor';
import type { TDiffOptions, TDiffResult, TDiffTreeNode } from '@/types/diff';
import type { JsonValue } from '@/types/json';
import { diffSessionsDB, type TDiffSession, type TDiffSessionId } from '@/utils/indexeddb/diff-sessions-db';
import { useSettingsStore } from '@/stores/settingsStore';
import { parsePayload } from '@/utils/document-pipeline';

export type TDiffMode = 'normal' | 'compare';
type TPanelParseError = NonNullable<IParseResult['error']>;

type TDiffPanelState = {
  raw: string;
  format: TDataType;
  parsed: JsonValue | null;
  valid: boolean;
  error: TPanelParseError | null;
};

type TDiffWorkerResponse =
  | {
      id: number;
      success: true;
      diffResult: TDiffResult;
      diffTree: TDiffTreeNode | null;
      computeTime: number;
    }
  | {
      id: number;
      success: false;
      error: { message: string };
      leftError?: TPanelParseError | null;
      rightError?: TPanelParseError | null;
      computeTime: number;
    };

const DEFAULT_DIFF_OPTIONS: Required<Pick<TDiffOptions, 'arrayOrderMatters' | 'ignoreTypeDiff' | 'ignoreKeys' | 'ignoreVolatileFields' | 'volatileKeys' | 'compareArrayByKey' | 'normalizeDates' | 'includeUnchanged'>> = {
  arrayOrderMatters: true,
  ignoreTypeDiff: false,
  ignoreKeys: [],
  ignoreVolatileFields: false,
  volatileKeys: DEFAULT_VOLATILE_KEYS,
  compareArrayByKey: '',
  normalizeDates: false,
  includeUnchanged: true,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  return error instanceof Error ? error.message : fallback;
};

const markJsonValueRaw = (value: JsonValue | null): JsonValue | null => {
  return value !== null && typeof value === 'object' ? markRaw(value) : value;
};

/**
 * Store for managing JSON/XML comparison (diff) state.
 */
export const useDiffStore = defineStore('diff', () => {
  const mode = ref<TDiffMode>('normal');
  const settingsStore = useSettingsStore();

  const left = ref({
    raw: '',
    format: 'json' as TDataType,
    parsed: null,
    valid: true,
    error: null
  }) as Ref<TDiffPanelState>;

  const right = ref({
    raw: '',
    format: 'json' as TDataType,
    parsed: null,
    valid: true,
    error: null
  }) as Ref<TDiffPanelState>;

  const diffResult = shallowRef(null) as Ref<TDiffResult | null>;
  const diffTree = shallowRef(null) as Ref<TDiffTreeNode | null>;
  const isComputingDiff = ref(false);
  const diffComputeTime = ref(0);
  const diffError = ref<string | null>(null);
  const diffOptions = ref<TDiffOptions>({ ...DEFAULT_DIFF_OPTIONS });

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
  let activeDiffRequest: { id: number; cacheKey: string } | null = null;

  // Heuristic: only offload to worker for sufficiently large inputs (avoid overhead on tiny diffs)
  const DIFF_WORKER_THRESHOLD_CHARS = 300_000;
  const LARGE_DIFF_DETAIL_LIMIT = 5_000;
  const LARGE_DIFF_PATCH_LIMIT = 5_000;
  const PERSISTENCE_MAX_RAW_CHARS = 2_000_000;
  const DIFF_CACHE_MAX_ENTRIES = 20;
  const DIFF_CACHE_MAX_ENTRY_BYTES = 2_000_000;

  // Состояние отображения
  const showOnlyChanges = ref(false);
  const currentChangeIndex = ref(-1);

  const getRetentionDays = () => settingsStore.settings.diffPersistence?.retentionDays ?? 30;
  const getMaxSessions = () => settingsStore.settings.diffPersistence?.maxSessions ?? 100;

  const getDiffOptionsSnapshot = (): TDiffOptions => {
    const current = diffOptions.value;
    return {
      arrayOrderMatters: current.arrayOrderMatters ?? DEFAULT_DIFF_OPTIONS.arrayOrderMatters,
      ignoreTypeDiff: current.ignoreTypeDiff ?? DEFAULT_DIFF_OPTIONS.ignoreTypeDiff,
      ignoreKeys: [...toRaw(current.ignoreKeys ?? DEFAULT_DIFF_OPTIONS.ignoreKeys)],
      ignoreVolatileFields: current.ignoreVolatileFields ?? DEFAULT_DIFF_OPTIONS.ignoreVolatileFields,
      volatileKeys: [...toRaw(current.volatileKeys ?? DEFAULT_DIFF_OPTIONS.volatileKeys)],
      compareArrayByKey: current.compareArrayByKey ?? DEFAULT_DIFF_OPTIONS.compareArrayByKey,
      normalizeDates: current.normalizeDates ?? DEFAULT_DIFF_OPTIONS.normalizeDates,
      includeUnchanged: current.includeUnchanged ?? DEFAULT_DIFF_OPTIONS.includeUnchanged,
    };
  };

  const maxRawLength = () => Math.max(left.value.raw.length, right.value.raw.length);
  const shouldUseWorkerForCurrentInput = () => maxRawLength() >= DIFF_WORKER_THRESHOLD_CHARS;

  /**
   * Universal parsing function
   */
  const parseContent = (content: string, format: TDataType): IParseResult => parsePayload(content, format);

  /**
   * Sets the application mode (normal or diff).
   */
  const setMode = (newMode: TDiffMode) => {
    mode.value = newMode;
  };

  const generateSessionId = (): TDiffSessionId => {
    return `diff_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };

  const estimateSizeBytes = (obj: unknown): number => {
    try {
      const json = JSON.stringify(obj);
      if (!json) return 0;
      return new Blob([json]).size;
    } catch {
      return 0;
    }
  };

  const buildSessionPayload = (): Omit<TDiffSession, 'id' | 'createdAt' | 'updatedAt' | 'title'> => {
    // Cache diff only if it's small enough (avoid exploding storage for huge diffs)
    let cachedDiffResult: TDiffResult | null = null;
    let cachedDiffTree: TDiffTreeNode | null = null;

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
      diffOptions: getDiffOptionsSnapshot(),
      diffResult: cachedDiffResult,
      diffTree: cachedDiffTree,
      sizeBytes: 0, // computed in save
    };
  };

  const saveSessionNow = async (opts?: { title?: string; forceNew?: boolean }) => {
    if (mode.value !== 'compare') return;
    if (!left.value.raw && !right.value.raw) return;
    if (maxRawLength() > PERSISTENCE_MAX_RAW_CHARS) {
      // Large local compares should not freeze the tab by autosaving tens of MB into IndexedDB.
      return;
    }

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
    } catch (e: unknown) {
      lastSaveError.value = getErrorMessage(e, 'Failed to save session');
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
      diffOptions.value = { ...DEFAULT_DIFF_OPTIONS, ...(session.diffOptions ?? {}) };

      // If cached diff is present and matches the current semantic result shape, restore immediately.
      // Older IndexedDB sessions are recomputed below so the UI never reads missing summary fields.
      const cachedResult = session.diffResult && 'riskSummary' in session.diffResult ? session.diffResult : null;
      diffResult.value = cachedResult;
      diffTree.value = cachedResult ? (session.diffTree || null) : null;

      updateValidation();
      computeDiff();
      lastLoadedAt.value = Date.now();
    } finally {
      isRestoring.value = false;
    }
  };

  const initPersistence = async () => {
    if (mode.value !== 'compare') return;
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

  const setDiffOptions = (options: Partial<TDiffOptions>) => {
    diffOptions.value = {
      ...diffOptions.value,
      ...options,
      ignoreKeys: options.ignoreKeys ?? diffOptions.value.ignoreKeys ?? [],
      volatileKeys: options.volatileKeys ?? diffOptions.value.volatileKeys ?? DEFAULT_VOLATILE_KEYS,
    };
  };

  const resetDiffOptions = () => {
    diffOptions.value = {
      ...DEFAULT_DIFF_OPTIONS,
      ignoreKeys: [],
      volatileKeys: [...DEFAULT_VOLATILE_KEYS],
    };
  };

  /**
   * Updates validation state for all panels.
   */
  const updateValidation = () => {
    const leftIsEmpty = !left.value.raw.trim();
    const rightIsEmpty = !right.value.raw.trim();

    if (leftIsEmpty) {
      left.value.valid = true;
      left.value.error = null;
      left.value.parsed = null;
    }

    if (rightIsEmpty) {
      right.value.valid = true;
      right.value.error = null;
      right.value.parsed = null;
    }

    if (leftIsEmpty && rightIsEmpty) {
      return { leftRes: null, rightRes: null };
    }

    if (shouldUseWorkerForCurrentInput()) {
      left.value.valid = true;
      right.value.valid = true;
      left.value.error = null;
      right.value.error = null;
      left.value.parsed = null;
      right.value.parsed = null;
      return { leftRes: null, rightRes: null };
    }

    const leftRes = leftIsEmpty ? null : parseContent(left.value.raw, left.value.format);
    const rightRes = rightIsEmpty ? null : parseContent(right.value.raw, right.value.format);

    if (leftRes) {
      left.value.valid = leftRes.success;
      left.value.error = leftRes.error || null;
      left.value.parsed = leftRes.success ? markJsonValueRaw(leftRes.data ?? null) : null;
    }

    if (rightRes) {
      right.value.valid = rightRes.success;
      right.value.error = rightRes.error || null;
      right.value.parsed = rightRes.success ? markJsonValueRaw(rightRes.data ?? null) : null;
    }

    return { leftRes, rightRes };
  };

  const diffCache = new Map<string, { result: TDiffResult, tree: TDiffTreeNode }>();

  const getDiffCacheEntry = (key: string) => {
    const entry = diffCache.get(key);
    if (!entry) return null;
    diffCache.delete(key);
    diffCache.set(key, entry);
    return entry;
  };

  const setDiffCacheEntry = (key: string, entry: { result: TDiffResult, tree: TDiffTreeNode }) => {
    const size = estimateSizeBytes(entry.result);
    if (size <= 0 || size > DIFF_CACHE_MAX_ENTRY_BYTES) return;

    diffCache.set(key, entry);
    while (diffCache.size > DIFF_CACHE_MAX_ENTRIES) {
      const oldestKey = diffCache.keys().next().value as string | undefined;
      if (!oldestKey) break;
      diffCache.delete(oldestKey);
    }
  };

  const terminateDiffWorker = () => {
    diffWorker?.terminate();
    diffWorker = null;
    activeDiffRequest = null;
  };

  const getDiffWorker = () => {
    if (diffWorker) return diffWorker;

    diffWorker = new Worker(new URL('../workers/diff.worker.ts', import.meta.url), {
      type: 'module',
    });

    diffWorker.onmessage = (e: MessageEvent<TDiffWorkerResponse>) => {
      const message = e.data;
      const request = activeDiffRequest;
      if (!request || message.id !== request.id) {
        return;
      }

      diffComputeTime.value = message.computeTime || 0;
      if (message.success) {
        left.value.valid = true;
        right.value.valid = true;
        left.value.error = null;
        right.value.error = null;
        left.value.parsed = null;
        right.value.parsed = null;
        diffResult.value = markRaw(message.diffResult);
        diffTree.value = message.diffTree ? markRaw(message.diffTree) : null;
        currentChangeIndex.value = -1;
        if (message.diffTree) {
          setDiffCacheEntry(request.cacheKey, { result: message.diffResult, tree: message.diffTree });
        }
      } else {
        diffError.value = message.error.message || 'Failed to compute diff';
        left.value.valid = !message.leftError;
        right.value.valid = !message.rightError;
        left.value.error = message.leftError || null;
        right.value.error = message.rightError || null;
        diffResult.value = null;
        diffTree.value = null;
      }

      activeDiffRequest = null;
      isComputingDiff.value = false;
    };

    diffWorker.onerror = (e) => {
      console.error('Diff worker error:', e);
      diffError.value = 'Diff worker error';
      diffResult.value = null;
      diffTree.value = null;
      isComputingDiff.value = false;
      terminateDiffWorker();
    };

    return diffWorker;
  };

  /**
   * Performs JSON/XML comparison based on current raw inputs.
   */
  const computeDiff = () => {
    if (!left.value.raw.trim() || !right.value.raw.trim()) {
      terminateDiffWorker();
      diffResult.value = null;
      diffTree.value = null;
      diffError.value = null;
      isComputingDiff.value = false;
      return;
    }

    const optionsSnapshot = getDiffOptionsSnapshot();

    // Check cache first
    const cacheKey = `${left.value.raw.length}-${right.value.raw.length}-${left.value.raw.slice(0, 100)}-${right.value.raw.slice(0, 100)}-${JSON.stringify(optionsSnapshot)}`;
    const cached = getDiffCacheEntry(cacheKey);
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
      terminateDiffWorker();
      if (!left.value.valid || !right.value.valid || left.value.parsed === null || right.value.parsed === null) {
        diffResult.value = null;
        diffTree.value = null;
        diffError.value = null;
        isComputingDiff.value = false;
        return;
      }

      try {
        isComputingDiff.value = false;
        diffError.value = null;
        diffComputeTime.value = 0;

        const leftPrepared = normalizeForDiff(toRaw(left.value.parsed), optionsSnapshot);
        const rightPrepared = normalizeForDiff(toRaw(right.value.parsed), optionsSnapshot);
        const result = diffJson(leftPrepared, rightPrepared, optionsSnapshot);
        const tree = buildDiffTree(leftPrepared, rightPrepared);
        result.contractDiff = diffGeneratedContracts(leftPrepared, rightPrepared);

        diffResult.value = markRaw(result);
        diffTree.value = markRaw(tree);
        currentChangeIndex.value = -1;

        setDiffCacheEntry(cacheKey, { result, tree });
      } catch (e: unknown) {
        console.error('Failed to compute diff:', e);
        diffError.value = getErrorMessage(e, 'Failed to compute diff');
        diffResult.value = null;
        diffTree.value = null;
      }
      return;
    }

    // Large diffs: compute in a Web Worker, ensure only latest request applies
    isComputingDiff.value = true;
    diffError.value = null;
    if (activeDiffRequest) {
      terminateDiffWorker();
    }
    const requestId = ++diffRequestId;
    activeDiffRequest = { id: requestId, cacheKey };

    getDiffWorker().postMessage({
      id: requestId,
      leftRaw: left.value.raw,
      rightRaw: right.value.raw,
      leftFormat: left.value.format,
      rightFormat: right.value.format,
      options: {
        ...optionsSnapshot,
        includeUnchanged: false,
        maxDetailedChanges: LARGE_DIFF_DETAIL_LIMIT,
        maxPatchOperations: LARGE_DIFF_PATCH_LIMIT,
      },
      skipTree: true,
    });
  };

  const getAdaptiveDiffDelay = () => {
    const length = maxRawLength();
    if (length > 10 * 1024 * 1024) return 1200;
    if (length > 1 * 1024 * 1024) return 800;
    return 400;
  };

  const debouncedComputeDiff = debounce(computeDiff, getAdaptiveDiffDelay);

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
    () => diffOptions.value,
    mode
  ], () => {
    if (mode.value === 'compare') {
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
    diffOptions,
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
    setDiffOptions,
    resetDiffOptions,
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
