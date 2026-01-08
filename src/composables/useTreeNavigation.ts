import { type Ref, onMounted, onUnmounted } from 'vue';
import { useAppStore } from '../stores/appStore';
import { useTreeStore } from '../stores/treeStore';
import { TreeTraversal } from '../utils/tree-traversal';

export function useTreeNavigation(
  containerRef: Ref<HTMLElement | null>,
  options: {
    onNavigate?: (path: string) => void;
    nodes?: Ref<any[]>;
  } = {}
) {
  const appStore = useAppStore();
  const treeStore = useTreeStore();

  const scrollToNode = (path: string) => {
    if (options.onNavigate) {
      options.onNavigate(path);
      return;
    }

    // Ждем следующего тика, чтобы DOM обновился (если узел только что развернулся)
    setTimeout(() => {
      const element = containerRef.value?.querySelector(`[data-path="${path}"]`);
      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // Если фокус в инпуте или другом текстовом поле, игнорируем
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const visibleNodes = options.nodes?.value || TreeTraversal.getVisibleNodes(appStore.filteredData, treeStore.expandedNodes);
    if (visibleNodes.length === 0) return;

    const currentIndex = visibleNodes.findIndex(n => n.path === treeStore.selectedPath);

    // Если ничего не выбрано, выбираем первый узел при нажатии любой стрелки
    if (currentIndex === -1 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      const firstPath = visibleNodes[0]?.path;
      if (firstPath) {
        treeStore.setSelectedPath(firstPath);
        scrollToNode(firstPath);
      }
      return;
    }

    const currentNode = visibleNodes[currentIndex];
    if (!currentNode) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < visibleNodes.length - 1) {
          const nextPath = visibleNodes[currentIndex + 1]?.path;
          if (nextPath) {
            treeStore.setSelectedPath(nextPath);
            scrollToNode(nextPath);
          }
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
          const prevPath = visibleNodes[currentIndex - 1]?.path;
          if (prevPath) {
            treeStore.setSelectedPath(prevPath);
            scrollToNode(prevPath);
          }
        }
        break;

      case 'ArrowRight':
        event.preventDefault();
        if (currentNode.node.children && currentNode.node.children.length > 0) {
          if (!treeStore.isExpanded(currentNode.path)) {
            treeStore.toggleNode(currentNode.path);
          } else if (currentIndex < visibleNodes.length - 1) {
            // Если уже развернуто, переходим к первому ребенку
            const nextPath = visibleNodes[currentIndex + 1]?.path;
            if (nextPath) {
              treeStore.setSelectedPath(nextPath);
              scrollToNode(nextPath);
            }
          }
        }
        break;

      case 'ArrowLeft':
        event.preventDefault();
        if (treeStore.isExpanded(currentNode.path) && currentNode.node.children && currentNode.node.children.length > 0) {
          treeStore.toggleNode(currentNode.path);
        } else if (currentNode.parentPath) {
          // Переходим к родителю
          treeStore.setSelectedPath(currentNode.parentPath);
          scrollToNode(currentNode.parentPath);
        }
        break;

      case ' ': // Space
        event.preventDefault();
        if (currentNode.node.children && currentNode.node.children.length > 0) {
          treeStore.toggleNode(currentNode.path);
        }
        break;

      case 'Enter':
        event.preventDefault();
        // Копируем путь в буфер обмена
        navigator.clipboard.writeText(currentNode.path.replace(/^root\.?/, ''));
        // Можно добавить уведомление, но пока ограничимся этим
        break;
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  return {
    selectedPath: treeStore.selectedPath,
    setSelectedPath: treeStore.setSelectedPath
  };
}
