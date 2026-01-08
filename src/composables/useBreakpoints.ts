import { ref, onMounted, onUnmounted, computed } from 'vue';

/**
 * Composable for reactive screen size detection.
 * Provides boolean flags for mobile and other device types.
 */
export function useBreakpoints() {
  const width = ref(window.innerWidth);

  /**
   * Updates current window width.
   */
  const updateWidth = () => {
    width.value = window.innerWidth;
  };

  onMounted(() => {
    window.addEventListener('resize', updateWidth);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth);
  });

  const isMobile = computed(() => width.value < 768);
  const isTablet = computed(() => width.value >= 768 && width.value < 1024);
  const isDesktop = computed(() => width.value >= 1024);

  return {
    width,
    isMobile,
    isTablet,
    isDesktop
  };
}
