import type { TTreeNode, TDocumentStatistics, TTypeDistribution } from '@/types/store';

export default class StatisticsCalculator {
  public static calculate(
    node: TTreeNode | null,
    rawInputLength: number,
    format: string,
    isValid: boolean,
    parseTime: number
  ): TDocumentStatistics {
    const distribution: TTypeDistribution = {
      object: 0,
      array: 0,
      string: 0,
      number: 0,
      boolean: 0,
      null: 0
    };

    if (!node) {
      return {
        size: rawInputLength,
        nodes: 0,
        depth: 0,
        maxWidth: 0,
        format,
        isValid,
        parseTime,
        typeDistribution: distribution
      };
    }

    let nodesCount = 0;
    let maxDepth = 0;
    let maxWidth = 0;
    const stack: Array<{ node: TTreeNode; depth: number }> = [{ node, depth: 1 }];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      const { node: currentNode, depth } = current;
      nodesCount++;
      distribution[currentNode.type]++;
      maxDepth = Math.max(maxDepth, depth);

      if (currentNode.children && currentNode.children.length > 0) {
        maxWidth = Math.max(maxWidth, currentNode.children.length);
        for (let index = currentNode.children.length - 1; index >= 0; index--) {
          const child = currentNode.children[index];
          if (child) stack.push({ node: child, depth: depth + 1 });
        }
      }
    }

    return {
      size: rawInputLength,
      nodes: nodesCount,
      depth: maxDepth,
      maxWidth: maxWidth,
      format,
      isValid,
      parseTime,
      typeDistribution: distribution
    };
  }
}

export const createDocumentStatistics = (
  node: TTreeNode | null,
  rawInputLength: number,
  format: string,
  isValid: boolean,
  parseTime: number
): TDocumentStatistics => {
  return StatisticsCalculator.calculate(node, rawInputLength, format, isValid, parseTime);
};
