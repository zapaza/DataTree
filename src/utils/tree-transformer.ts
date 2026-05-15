import type { TTreeNode, TTreeNodeType } from '@/types/store';
import type { JsonValue } from '@/types/json';
import { isJsonObject } from '@/types/json';

/**
 * Utility for transforming raw data into a unified tree structure.
 */
export default class TreeTransformer {
  public static transform(value: JsonValue, key: string = 'root'): TTreeNode {
    const root = this.createNode(value, key);
    const stack: Array<{ node: TTreeNode; value: JsonValue }> = [{ node: root, value }];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      const { node, value: currentValue } = current;

      if (isJsonObject(currentValue)) {
        const entries = Object.entries(currentValue);
        node.children = entries.map(([childKey, childValue]) => this.createNode(childValue, childKey));
        for (let index = entries.length - 1; index >= 0; index--) {
          const entry = entries[index];
          const child = node.children[index];
          if (entry && child) {
            stack.push({ node: child, value: entry[1] });
          }
        }
      } else if (Array.isArray(currentValue)) {
        node.children = currentValue.map((childValue, index) => this.createNode(childValue, `[${index}]`));
        for (let index = currentValue.length - 1; index >= 0; index--) {
          const child = node.children[index];
          if (child) {
            stack.push({ node: child, value: currentValue[index] ?? null });
          }
        }
      }
    }

    return root;
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
    let count = 0;
    const stack = [node];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      count++;

      if (current.children) {
        for (let index = current.children.length - 1; index >= 0; index--) {
          const child = current.children[index];
          if (child) stack.push(child);
        }
      }
    }

    return count;
  }

  private static createNode(value: JsonValue, key: string): TTreeNode {
    const type = this.getType(value);
    return {
      type,
      key,
      value: (type === 'object' || type === 'array') ? null : value
    };
  }
}
