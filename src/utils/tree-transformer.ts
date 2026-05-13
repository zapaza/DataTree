import type { TTreeNode, TTreeNodeType } from '@/types/store';
import type { JsonValue } from '@/types/json';
import { isJsonObject } from '@/types/json';

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
  public static transform(value: JsonValue, key: string = 'root'): TTreeNode {
    const type = this.getType(value);
    const node: TTreeNode = {
      type,
      key,
      value: (type === 'object' || type === 'array') ? null : value
    };

    if (isJsonObject(value)) {
      node.children = Object.entries(value).map(([k, v]) => this.transform(v, k));
    } else if (Array.isArray(value)) {
      node.children = value.map((v, i) => this.transform(v, `[${i}]`));
    }

    return node;
  }

  private static getType(value: JsonValue): TTreeNodeType {
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
