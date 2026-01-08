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

    const traverse = (currentNode: TTreeNode, depth: number) => {
      nodesCount++;
      distribution[currentNode.type]++;
      maxDepth = Math.max(maxDepth, depth);

      if (currentNode.children && currentNode.children.length > 0) {
        maxWidth = Math.max(maxWidth, currentNode.children.length);
        currentNode.children.forEach(child => traverse(child, depth + 1));
      }
    };

    traverse(node, 1);

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
