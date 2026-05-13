import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import SafeJsonParser from '@/utils/parsers/json-parser';
import type { JsonObject, JsonValue } from '@/types/json';

export default class JsonXmlConverter {
  private static xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
  });

  private static xmlBuilder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    indentBy: '  ',
  });

  public static jsonToXml(jsonString: string): string | null {
    const result = SafeJsonParser.parse(jsonString);
    if (!result.success || !result.data) {
      return null;
    }

    try {
      // Если данных несколько на верхнем уровне, оборачиваем в <root>
      let dataToBuild: JsonValue = result.data;

      if (typeof dataToBuild !== 'object' || dataToBuild === null || Array.isArray(dataToBuild)) {
        dataToBuild = { root: dataToBuild };
      } else if (Object.keys(dataToBuild).length !== 1) {
        dataToBuild = { root: dataToBuild };
      }

      return this.xmlBuilder.build(dataToBuild);
    } catch (e) {
      console.error('JSON to XML conversion error:', e);
      return null;
    }
  }

  public static xmlToJson(xmlString: string): string | null {
    try {
      const jsonObj = this.xmlParser.parse(xmlString) as JsonObject;
      return JSON.stringify(jsonObj, null, 2);
    } catch (e) {
      console.error('XML to JSON conversion error:', e);
      return null;
    }
  }
}
