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

  public static sortKeys(jsonString: string): string {
    const result = SafeJsonParser.parse(jsonString);
    if (result.success && result.data !== undefined) {
      const sorted = this.sortObject(result.data);
      return JSON.stringify(sorted, null, 2);
    }
    return jsonString;
  }

  private static sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }

    const sortedObj: any = {};
    Object.keys(obj)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }))
      .forEach(key => {
        sortedObj[key] = this.sortObject(obj[key]);
      });

    return sortedObj;
  }
}
