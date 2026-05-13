import { z } from 'zod';
import type { JsonObject, JsonValue } from '@/types/json';

export default class SchemaValidator {

  public static validate(data: JsonValue, schemaStr: string): { success: boolean, errors?: string[] } {
    try {
      // Для простоты реализации представим, что мы поддерживаем базовые схемы Zod
      // В полноценном приложении здесь был бы парсер JSON Schema -> Zod
      // или использование библиотеки ajv для JSON Schema.

      // Пример простой реализации:
      if (!schemaStr || schemaStr.trim() === '') return { success: true };

      const schemaObj = JSON.parse(schemaStr);
      const zodSchema = this.buildZodSchema(schemaObj);

      const result = zodSchema.safeParse(data);

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          errors: result.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
        };
      }
    } catch (e: unknown) {
      return { success: false, errors: [e instanceof Error ? e.message : 'Invalid schema'] };
    }
  }

  private static buildZodSchema(obj: JsonValue): z.ZodTypeAny {
    if (typeof obj === 'string') {
      switch (obj.toLowerCase()) {
        case 'string': return z.string();
        case 'number': return z.number();
        case 'boolean': return z.boolean();
        case 'null': return z.null();
        default: return z.any();
      }
    }

    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        return z.array(this.buildZodSchema(obj[0]!));
      }
      return z.array(z.any());
    }

    if (typeof obj === 'object' && obj !== null) {
      const shape: Record<string, z.ZodTypeAny> = {};
      const schemaObject = obj as JsonObject;
      for (const key in schemaObject) {
        shape[key] = this.buildZodSchema(schemaObject[key]!);
      }
      return z.object(shape);
    }

    return z.any();
  }
}
