import type { IXmlParseResult } from '@/types/editor';

export default class XmlToJsonConverter {
  static convert(data: any, name: string = 'root'): IXmlParseResult {
    const result: IXmlParseResult = {
      success: true,
      name,
      data: null,
      attributes: {},
      children: []
    };

    if (data === null || data === undefined) {
      return result;
    }

    if (typeof data !== 'object') {
      result.data = data;
      return result;
    }

    // Обработка атрибутов и дочерних элементов
    for (const key in data) {
      if (key.startsWith('@_')) {
        // Это атрибут
        const attrName = key.substring(2);
        if (result.attributes) {
          result.attributes[attrName] = String(data[key]);
        }
      } else if (key === '#text' || key === '#cdata') {
        // Это текстовое содержимое или CDATA узла
        result.data = data[key];
      } else if (key.startsWith('?xml')) {
        // Игнорируем декларацию XML
        continue;
      } else {
        // Это дочерний элемент
        const childData = data[key];
        if (Array.isArray(childData)) {
          childData.forEach(item => {
            const child = this.convert(item, key);
            // Если у ребенка есть имя, мы должны сохранить его.
            // Но наша структура IXmlParseResult не имеет поля name.
            // Добавим его в интерфейс или будем использовать data как обертку.
            result.children?.push(child);
          });
        } else {
          result.children?.push(this.convert(childData, key));
        }
      }
    }

    // Если нет детей, удаляем свойство
    if (result.children?.length === 0) {
      delete result.children;
    }

    // Если нет атрибутов, удаляем свойство
    if (Object.keys(result.attributes || {}).length === 0) {
      delete result.attributes;
    }

    return result;
  }
}
