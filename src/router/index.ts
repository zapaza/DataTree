import { createRouter, createWebHistory } from 'vue-router'
import MainEditorView from '@/views/MainEditorView.vue'
import DiffEditorView from '@/views/DiffEditorView.vue'
import type { TProductMode } from '@/config/product-modes'

const modeMeta = (mode: TProductMode) => ({ mode })

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/inspect'
    },
    {
      path: '/inspect',
      name: 'inspect',
      component: MainEditorView,
      meta: modeMeta('inspect')
    },
    {
      path: '/validate',
      name: 'validate',
      component: MainEditorView,
      meta: modeMeta('validate')
    },
    {
      path: '/diff',
      redirect: '/compare'
    },
    {
      path: '/compare',
      name: 'compare',
      component: DiffEditorView,
      meta: modeMeta('compare')
    },
    {
      path: '/transform',
      name: 'transform',
      component: MainEditorView,
      meta: modeMeta('transform')
    }
  ],
})

export default router
