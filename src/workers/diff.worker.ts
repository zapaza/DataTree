import diffJson from '@/utils/diff-algorithms/json-diff'
import buildDiffTree from '@/utils/diff-algorithms/diff-tree-builder'
import { diffGeneratedContracts } from '@/utils/diff-algorithms/contract-diff'
import { normalizeForDiff } from '@/utils/diff-algorithms/semantic-utils'
import { parsePayload } from '@/utils/document-pipeline'
import type { TDataType, IParseResult } from '@/types/editor'
import type { TDiffOptions, TDiffResult, TDiffTreeNode } from '@/types/diff'
import type { JsonValue } from '@/types/json'

type TDiffWorkerRequest = {
  id: number
  left?: JsonValue
  right?: JsonValue
  leftRaw?: string
  rightRaw?: string
  leftFormat?: TDataType
  rightFormat?: TDataType
  options?: TDiffOptions
  skipTree?: boolean
}

type TPanelParseError = NonNullable<IParseResult['error']>

type TDiffWorkerResponse =
  | {
      id: number
      success: true
      diffResult: TDiffResult
      diffTree: TDiffTreeNode | null
      computeTime: number
    }
  | {
      id: number
      success: false
      error: { message: string }
      leftError?: TPanelParseError | null
      rightError?: TPanelParseError | null
      computeTime: number
    }

const parseWorkerInput = (
  raw: string | undefined,
  format: TDataType | undefined,
  parsed: JsonValue | undefined
): { value: JsonValue | null; error: TPanelParseError | null } => {
  if (raw !== undefined && format) {
    const result = parsePayload(raw, format)
    return {
      value: result.success ? (result.data ?? null) : null,
      error: result.error || null,
    }
  }

  return {
    value: parsed ?? null,
    error: null,
  }
}

self.onmessage = (e: MessageEvent<TDiffWorkerRequest>) => {
  const { id, left, right, leftRaw, rightRaw, leftFormat, rightFormat, options = {}, skipTree = false } = e.data
  const start = performance.now()

  try {
    const leftResult = parseWorkerInput(leftRaw, leftFormat, left)
    const rightResult = parseWorkerInput(rightRaw, rightFormat, right)

    if (leftResult.error || rightResult.error || leftResult.value === null || rightResult.value === null) {
      const end = performance.now()
      const msg: TDiffWorkerResponse = {
        id,
        success: false,
        error: { message: leftResult.error?.message || rightResult.error?.message || 'Failed to parse compare input' },
        leftError: leftResult.error,
        rightError: rightResult.error,
        computeTime: Number((end - start).toFixed(2)),
      }
      self.postMessage(msg)
      return
    }

    const leftPrepared = normalizeForDiff(leftResult.value, options)
    const rightPrepared = normalizeForDiff(rightResult.value, options)
    const diffResult = diffJson(leftPrepared, rightPrepared, options)
    diffResult.contractDiff = diffGeneratedContracts(leftPrepared, rightPrepared)
    const diffTree = skipTree ? null : buildDiffTree(leftPrepared, rightPrepared)
    const end = performance.now()

    const msg: TDiffWorkerResponse = {
      id,
      success: true,
      diffResult,
      diffTree,
      computeTime: Number((end - start).toFixed(2)),
    }
    self.postMessage(msg)
  } catch (err: unknown) {
    const end = performance.now()
    const msg: TDiffWorkerResponse = {
      id,
      success: false,
      error: { message: err instanceof Error ? err.message : 'Diff worker error' },
      computeTime: Number((end - start).toFixed(2)),
    }
    self.postMessage(msg)
  }
}
