import { XMLParser, XMLValidator } from 'fast-xml-parser';

export default class XmlParser {
  private static parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
  });

  static parse(xmlString: string): { data: any; error: string | null; position: { line: number; column: number } | null } {
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
      const data = this.parser.parse(xmlString);
      return { data, error: null, position: null };
    } catch (e: any) {
      return {
        data: null,
        error: e.message || 'Unknown XML parsing error',
        position: { line: 1, column: 1 },
      };
    }
  }
}
