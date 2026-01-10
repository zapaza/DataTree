import type { TTreeNode } from '@/types/store';

export interface ISearchResult {
  path: string;
  keyMatch: boolean;
  valueMatch: boolean;
  text: string;
}

export class SearchIndex {
  public static search(node: TTreeNode, query: string, path: string = 'root'): ISearchResult[] {
    const results: ISearchResult[] = [];
    const normalizedQuery = query.toLowerCase();

    // Проверяем ключ
    const keyMatch = node.key.toLowerCase().includes(normalizedQuery);

    // Проверяем значение
    let valueMatch = false;
    let valueText = '';

    if (node.value === null) {
      if (normalizedQuery === 'null') {
        valueMatch = true;
        valueText = 'null';
      }
    } else if (node.value !== undefined) {
      valueText = String(node.value);
      valueMatch = valueText.toLowerCase().includes(normalizedQuery);
    }

    if (keyMatch || valueMatch) {
      results.push({
        path,
        keyMatch,
        valueMatch,
        text: valueMatch ? valueText : node.key
      });
    }

    // Рекурсивно ищем в детях
    if (node.children) {
      node.children.forEach(child => {
        const childPath = `${path}.${child.key}`;
        results.push(...this.search(child, query, childPath));
      });
    }

    return results;
  }
}
