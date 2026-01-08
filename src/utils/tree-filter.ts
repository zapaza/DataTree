import type { TTreeNode, TTreeFilters } from '@/types/store';

export default class TreeFilter {
  public static filter(node: TTreeNode, filters: TTreeFilters, depth: number = 0): TTreeNode | null {
    // 1. Проверка максимальной глубины
    if (depth > filters.maxDepth) {
      return null;
    }

    // 2. Проверка по типу
    if (filters.hideTypes.includes(node.type)) {
      return null;
    }

    // 3. Проверка на null
    if (filters.hideNull && node.type === 'null') {
      return null;
    }

    // Обработка сложных типов (object, array)
    if (node.type === 'object' || node.type === 'array') {
      if (!node.children) {
        // Если детей нет (пустая структура)
        if (node.type === 'object' && filters.hideEmptyObjects) return null;
        if (node.type === 'array' && filters.hideEmptyArrays) return null;
        return { ...node };
      }

      // Рекурсивно фильтруем детей
      const filteredChildren = node.children
        .map(child => this.filter(child, filters, depth + 1))
        .filter((child): child is TTreeNode => child !== null);

      // Проверка на пустоту после фильтрации детей
      if (filteredChildren.length === 0) {
        if (node.type === 'object' && filters.hideEmptyObjects) return null;
        if (node.type === 'array' && filters.hideEmptyArrays) return null;
      }

      return {
        ...node,
        children: filteredChildren
      };
    }

    // Простые типы (string, number, boolean)
    return { ...node };
  }
}
