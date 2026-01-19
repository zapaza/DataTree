import diffJson from '@/utils/diff-algorithms/json-diff'
import buildDiffTree from '@/utils/diff-algorithms/diff-tree-builder'

type TDiffWorkerRequest = {
  id: number
  left: any
  right: any
}

type TDiffWorkerResponse =
  | {
      id: number
      success: true
      diffResult: any
      diffTree: any
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
  } catch (err: any) {
    const end = performance.now()
    const msg: TDiffWorkerResponse = {
      id,
      success: false,
      error: { message: err?.message || 'Diff worker error' },
      computeTime: Number((end - start).toFixed(2)),
    }
    self.postMessage(msg)
  }
}

