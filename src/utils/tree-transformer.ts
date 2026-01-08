import type { TTreeNode, TTreeNodeType } from '@/types/store';

/**
 * Utility for transforming raw data into a unified tree structure.
 */
export default class TreeTransformer {
  /**
   * Recursively transforms an object or array into a TTreeNode structure.
   * @param value - The data to transform.
   * @param key - The key associated with the data (default 'root').
   * @returns A TTreeNode object.
   */
  public static transform(value: any, key: string = 'root'): TTreeNode {
    const type = this.getType(value);
    const node: TTreeNode = {
      type,
      key,
      value: (type === 'object' || type === 'array') ? null : value
    };

    if (type === 'object') {
      node.children = Object.entries(value).map(([k, v]) => this.transform(v, k));
    } else if (type === 'array') {
      node.children = (value as any[]).map((v, i) => this.transform(v, `[${i}]`));
    }

    return node;
  }

  private static getType(value: any): TTreeNodeType {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    const type = typeof value;
    if (type === 'object') return 'object';
    if (type === 'string') return 'string';
    if (type === 'number') return 'number';
    if (type === 'boolean') return 'boolean';
    return 'string'; // Fallback
  }

  public static countNodes(node: TTreeNode | null): number {
    if (!node) return 0;
    let count = 1;
    if (node.children) {
      count += node.children.reduce((acc, child) => acc + this.countNodes(child), 0);
    }
    return count;
  }
}
