import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { IParseResult } from '@/types/editor';

/**
 * Utility class for XML parsing and validation using fast-xml-parser.
 */
export default class XmlParser {
  private static parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
    processEntities: true,
    ignoreDeclaration: false,
  });

  /**
   * Validates and parses an XML string.
   * @param xmlString - The XML string to parse.
   * @returns A result object with parsed data or error details.
   */
  static parse(xmlString: string): IParseResult {
    if (!xmlString || !xmlString.trim()) {
      return { success: true, data: null };
    }

    const validationResult = XMLValidator.validate(xmlString);
    if (validationResult !== true) {
      return {
        success: false,
        error: {
          message: validationResult.err.msg || 'Invalid XML',
          line: validationResult.err.line,
          column: validationResult.err.col,
          snippet: validationResult.err.code // Используем код ошибки как сниппет если доступно
        }
      };
    }

    try {
      const data = this.parser.parse(xmlString);
      return {
        success: true,
        data
      };
    } catch (e: any) {
      return {
        success: false,
        error: {
          message: e.message || 'Unknown XML parsing error',
          line: 1,
          column: 1
        }
      };
    }
  }
}
