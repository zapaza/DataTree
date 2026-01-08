import { ref, onMounted, onUnmounted } from 'vue';

export default function useResizable(initialWidth: number = 50) {
  const leftWidth = ref(initialWidth);
  const isResizing = ref(false);

  const startResizing = () => {
    isResizing.value = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const stopResizing = () => {
    isResizing.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return;

    // Вычисляем ширину относительно ширины окна (или контейнера, но для простоты возьмем окно)
    // В идеале нужно брать ширину родительского контейнера
    const newWidth = (e.clientX / window.innerWidth) * 100;

    // Ограничения
    if (newWidth > 20 && newWidth < 80) {
      leftWidth.value = newWidth;
    }
  };

  onUnmounted(() => {
    stopResizing();
  });

  return {
    leftWidth,
    isResizing,
    startResizing
  };
}
