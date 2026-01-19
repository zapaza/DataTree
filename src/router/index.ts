import { createRouter, createWebHistory } from 'vue-router'
import MainEditorView from '@/views/MainEditorView.vue'
import DiffEditorView from '@/views/DiffEditorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'editor',
      component: MainEditorView
    },
    {
      path: '/diff',
      name: 'diff',
      component: DiffEditorView
    }
  ],
})

export default router
