import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useOnlineStatus() {
  const isOnline = ref<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)

  const update = () => {
    isOnline.value = navigator.onLine
  }

  onMounted(() => {
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })

  return { isOnline }
}

export default useOnlineStatus

