import type { TTreeNode, TTreeFilters } from '@/types/store';

export default class TreeFilter {
  public static filter(node: TTreeNode, filters: TTreeFilters): TTreeNode | null {
    type TFilterFrame = {
      node: TTreeNode;
      depth: number;
      parent: TFilterFrame | null;
      visited: boolean;
      children: TTreeNode[];
    };

    let filteredRoot: TTreeNode | null = null;
    const stack: TFilterFrame[] = [{
      node,
      depth: 0,
      parent: null,
      visited: false,
      children: []
    }];

    const finish = (frame: TFilterFrame, filteredNode: TTreeNode | null) => {
      if (frame.parent) {
        if (filteredNode) {
          frame.parent.children.push(filteredNode);
        }
        return;
      }

      filteredRoot = filteredNode;
    };

    while (stack.length > 0) {
      const frame = stack.pop();
      if (!frame) break;

      if (!frame.visited && this.shouldHideNode(frame.node, filters, frame.depth)) {
        finish(frame, null);
        continue;
      }

      const isBranch = frame.node.type === 'object' || frame.node.type === 'array';
      const children = frame.node.children;

      if (!isBranch) {
        finish(frame, { ...frame.node });
        continue;
      }

      if (!children?.length) {
        finish(frame, this.shouldHideEmptyBranch(frame.node, filters) ? null : { ...frame.node });
        continue;
      }

      if (!frame.visited) {
        frame.visited = true;
        stack.push(frame);

        for (let i = children.length - 1; i >= 0; i--) {
          const child = children[i];
          if (!child) continue;

          stack.push({
            node: child,
            depth: frame.depth + 1,
            parent: frame,
            visited: false,
            children: []
          });
        }
        continue;
      }

      finish(
        frame,
        frame.children.length === 0 && this.shouldHideEmptyBranch(frame.node, filters)
          ? null
          : { ...frame.node, children: frame.children }
      );
    }

    return filteredRoot;
  }

  private static shouldHideNode(node: TTreeNode, filters: TTreeFilters, depth: number): boolean {
    if (depth > filters.maxDepth) {
      return true;
    }

    if (filters.hideTypes.includes(node.type)) {
      return true;
    }

    return filters.hideNull && node.type === 'null';
  }

  private static shouldHideEmptyBranch(node: TTreeNode, filters: TTreeFilters): boolean {
    return (node.type === 'object' && filters.hideEmptyObjects)
      || (node.type === 'array' && filters.hideEmptyArrays);
  }
}
