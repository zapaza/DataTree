import diffJson from '@/utils/diff-algorithms/json-diff'
import buildDiffTree from '@/utils/diff-algorithms/diff-tree-builder'
import type { TDiffResult, TDiffTreeNode } from '@/types/diff'
import type { JsonValue } from '@/types/json'

type TDiffWorkerRequest = {
  id: number
  left: JsonValue
  right: JsonValue
}

type TDiffWorkerResponse =
  | {
      id: number
      success: true
      diffResult: TDiffResult
      diffTree: TDiffTreeNode
      computeTime: number
    }
  | {
      id: number
      success: false
      error: { message: string }
      computeTime: number
    }

self.onmessage = (e: MessageEvent<TDiffWorkerRequest>) => {
  const { id, left, right } = e.data
  const start = performance.now()

  try {
    const diffResult = diffJson(left, right)
    const diffTree = buildDiffTree(left, right)
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
