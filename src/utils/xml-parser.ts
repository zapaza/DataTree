import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { JsonValue } from '@/types/json';

type TXmlParseResult = {
  data: JsonValue;
  error: string | null;
  position: { line: number; column: number } | null;
};

export default class XmlParser {
  private static parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
  });

  static parse(xmlString: string): TXmlParseResult {
    if (!xmlString.trim()) {
      return { data: null, error: null, position: null };
    }

    const validationResult = XMLValidator.validate(xmlString);

    if (validationResult !== true) {
      return {
        data: null,
        error: validationResult.err.msg || 'Invalid XML',
        position: {
          line: validationResult.err.line,
          column: validationResult.err.col,
        },
      };
    }

    try {
      const data = this.parser.parse(xmlString) as JsonValue;
      return { data, error: null, position: null };
    } catch (e: unknown) {
      return {
        data: null,
        error: e instanceof Error ? e.message : 'Unknown XML parsing error',
        position: { line: 1, column: 1 },
      };
    }
  }
}
