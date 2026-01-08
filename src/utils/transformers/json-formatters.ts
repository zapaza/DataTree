import SafeJsonParser from '@/utils/parsers/json-parser';

export default class JsonFormatter {
  public static format(jsonString: string): string {
    const result = SafeJsonParser.parse(jsonString);
    if (result.success && result.data !== undefined) {
      return JSON.stringify(result.data, null, 2);
    }
    return jsonString;
  }

  public static minify(jsonString: string): string {
    const result = SafeJsonParser.parse(jsonString);
    if (result.success && result.data !== undefined) {
      return JSON.stringify(result.data);
    }
    return jsonString;
  }
}
