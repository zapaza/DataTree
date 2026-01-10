import type { TTreeNode, TTreeNodeType } from '@/types/store';

/**
 * Utility for converting flat object from fast-xml-parser into TTreeNode structure.
 */
export default class XmlToJsonConverter {
  /**
   * Converts a flat JS object (from fast-xml-parser) into a TTreeNode.
   * @param data - The data object to convert.
   * @param name - The key name for the node.
   * @returns A TTreeNode object.
   */
  static convert(data: any, name: string = 'root'): TTreeNode {
    const type = this.getType(data);
    const node: TTreeNode = {
      type,
      key: name,
      value: (type === 'object' || type === 'array') ? null : data
    };

    if (data === null || data === undefined) {
      return node;
    }

    if (typeof data !== 'object') {
      return node;
    }

    const children: TTreeNode[] = [];

    // Обработка атрибутов и дочерних элементов
    for (const key in data) {
      const val = data[key];

      if (key.startsWith('@_')) {
        // Это атрибут
        const attrName = key.substring(2);
        children.push({
          type: this.getType(val),
          key: `@${attrName}`,
          value: val
        });
      } else if (key === '#text' || key === '#cdata') {
        // Это текстовое содержимое или CDATA узла
        if (Object.keys(data).length === 1) {
          // Если это единственный ключ, то это значение самого узла
          node.value = val;
          node.type = this.getType(val);
        } else {
          children.push({
            type: this.getType(val),
            key: key === '#text' ? 'text' : 'cdata',
            value: val
          });
        }
      } else if (key.startsWith('?xml')) {
        // Игнорируем декларацию XML
        continue;
      } else {
        // Это дочерний элемент
        if (Array.isArray(val)) {
          val.forEach((item, index) => {
            // Для XML элементов массива используем имя тега + индекс для уникальности ключа
            children.push(this.convert(item, `${key}[${index}]`));
          });
        } else {
          children.push(this.convert(val, key));
        }
      }
    }

    if (children.length > 0) {
      node.children = children;
      node.type = 'object';
      node.value = null;
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
    return 'string';
  }
}
