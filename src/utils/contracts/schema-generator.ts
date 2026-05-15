import type { JsonObject, JsonValue } from '@/types/json';
import type { TGeneratedContract, TJsonSchema } from '@/types/contracts';

const JSON_SCHEMA_VERSION = 'https://json-schema.org/draft/2020-12/schema';

const isObject = (value: JsonValue): value is JsonObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const primitiveType = (value: JsonValue): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (isObject(value)) return 'object';
  if (Number.isInteger(value) && typeof value === 'number') return 'integer';
  return typeof value;
};

const detectStringFormat = (value: string): string | undefined => {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return 'uuid';
  if (/^https?:\/\/[^\s]+$/i.test(value)) return 'uri';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) return 'date-time';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
  return undefined;
};

const uniqSchemas = (schemas: TJsonSchema[]): TJsonSchema[] => {
  const seen = new Set<string>();
  return schemas.filter((schema) => {
    const key = JSON.stringify(schema);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const schemaTypes = (schema: TJsonSchema): string[] => {
  if (!schema.type) return [];
  return Array.isArray(schema.type) ? schema.type : [schema.type];
};

const withNullable = (schema: TJsonSchema): TJsonSchema => {
  const types = schemaTypes(schema);
  if (types.length && !types.includes('null')) {
    return { ...schema, type: [...types, 'null'] };
  }
  if (schema.anyOf) {
    return { anyOf: uniqSchemas([...schema.anyOf, { type: 'null' }]) };
  }
  return schema;
};

const mergeObjectSchemas = (schemas: TJsonSchema[]): TJsonSchema => {
  const properties: Record<string, TJsonSchema> = {};
  const requiredSets = schemas.map(schema => new Set(schema.required ?? []));
  const required = schemas.length
    ? [...requiredSets[0]!].filter(key => requiredSets.every(set => set.has(key)))
    : [];

  schemas.forEach((schema) => {
    Object.entries(schema.properties ?? {}).forEach(([key, propertySchema]) => {
      properties[key] = properties[key] ? mergeSchemas([properties[key]!, propertySchema]) : propertySchema;
    });
  });

  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
};

export const mergeSchemas = (schemas: TJsonSchema[]): TJsonSchema => {
  const normalized = schemas.filter(Boolean);
  if (normalized.length === 0) return {};
  if (normalized.length === 1) return normalized[0]!;

  const nonNull = normalized.filter(schema => !schemaTypes(schema).includes('null') || schemaTypes(schema).length > 1);
  const hasNull = normalized.some(schema => schemaTypes(schema).includes('null'));
  if (hasNull && nonNull.length === 1) return withNullable(nonNull[0]!);

  const types = normalized.map(schema => schemaTypes(schema).filter(type => type !== 'null').join('|'));
  const sameType = types.every(type => type === types[0]);

  if (sameType && types[0] === 'object') {
    const merged = mergeObjectSchemas(normalized);
    return hasNull ? withNullable(merged) : merged;
  }

  if (sameType && types[0] === 'array') {
    const merged: TJsonSchema = {
      type: 'array',
      items: mergeSchemas(normalized.map(schema => schema.items ?? {})),
    };
    return hasNull ? withNullable(merged) : merged;
  }

  if (sameType && types[0]) {
    const first = normalized[0]!;
    const formats = normalized.map(schema => schema.format).filter(Boolean);
    return {
      type: hasNull ? [...schemaTypes(first).filter(type => type !== 'null'), 'null'] : concreteTypeFromSchema(first),
      ...(formats.length === normalized.length && formats.every(format => format === formats[0]) ? { format: formats[0] } : {}),
    };
  }

  return {
    anyOf: uniqSchemas(normalized.flatMap(schema => schema.anyOf ?? [schema])),
  };
};

const concreteTypeFromSchema = (schema: TJsonSchema) => {
  return schemaTypes(schema).filter(type => type !== 'null')[0] || 'unknown';
};

export const generateJsonSchema = (value: JsonValue, title = 'GeneratedPayload', root = true): TJsonSchema => {
  const type = primitiveType(value);

  if (type === 'object') {
    const properties: Record<string, TJsonSchema> = {};
    Object.entries(value as JsonObject).forEach(([key, childValue]) => {
      properties[key] = generateJsonSchema(childValue, key, false);
    });

    return {
      ...(root ? { $schema: JSON_SCHEMA_VERSION, title } : {}),
      type: 'object',
      properties,
      required: Object.keys(properties),
      additionalProperties: false,
    };
  }

  if (type === 'array') {
    const items = value as JsonValue[];
    return {
      ...(root ? { $schema: JSON_SCHEMA_VERSION, title } : {}),
      type: 'array',
      items: items.length ? mergeSchemas(items.map(item => generateJsonSchema(item, title, false))) : {},
    };
  }

  if (type === 'string') {
    const format = detectStringFormat(value as string);
    return {
      ...(root ? { $schema: JSON_SCHEMA_VERSION, title } : {}),
      type: 'string',
      ...(format ? { format } : {}),
    };
  }

  return {
    ...(root ? { $schema: JSON_SCHEMA_VERSION, title } : {}),
    type,
  };
};

const pascalCase = (value: string) => {
  const cleaned = value.replace(/[^A-Za-z0-9]+/g, ' ').trim();
  const result = cleaned.split(/\s+/).map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join('');
  return /^[A-Za-z]/.test(result) ? result : `T${result || 'Generated'}`;
};

const propertyKey = (key: string) => (/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key));

const schemaToTsType = (schema: TJsonSchema, name: string, interfaces: string[]): string => {
  if (schema.anyOf?.length) {
    return schema.anyOf.map((item, index) => schemaToTsType(item, `${name}${index + 1}`, interfaces)).join(' | ');
  }

  const types = schemaTypes(schema);
  const nullable = types.includes('null');
  const concreteTypes = types.filter(type => type !== 'null');
  const baseType = concreteTypes.length > 1
    ? concreteTypes.map(type => schemaToTsType({ ...schema, type }, name, interfaces)).join(' | ')
    : (() => {
        switch (concreteTypes[0]) {
          case 'object': {
            const interfaceName = pascalCase(name);
            const required = new Set(schema.required ?? []);
            const fields = Object.entries(schema.properties ?? {}).map(([key, propertySchema]) => {
              const optional = required.has(key) ? '' : '?';
              return `  ${propertyKey(key)}${optional}: ${schemaToTsType(propertySchema, `${interfaceName}${pascalCase(key)}`, interfaces)};`;
            });
            interfaces.push(`export interface ${interfaceName} {\n${fields.join('\n')}\n}`);
            return interfaceName;
          }
          case 'array':
            return `${schemaToTsType(schema.items ?? {}, `${name}Item`, interfaces)}[]`;
          case 'integer':
          case 'number':
            return 'number';
          case 'boolean':
            return 'boolean';
          case 'string':
            return 'string';
          case 'null':
            return 'null';
          default:
            return 'unknown';
        }
      })();

  return nullable ? `${baseType} | null` : baseType;
};

export const generateTypeScriptInterfaces = (schema: TJsonSchema, rootName = 'GeneratedPayload'): string => {
  const interfaces: string[] = [];
  const rootType = schemaToTsType(schema, rootName, interfaces);
  if (!interfaces.some(item => item.startsWith(`export interface ${rootType} `))) {
    interfaces.unshift(`export type ${pascalCase(rootName)} = ${rootType};`);
  }
  return interfaces.reverse().join('\n\n');
};

const schemaToZod = (schema: TJsonSchema): string => {
  if (schema.anyOf?.length) {
    return `z.union([${schema.anyOf.map(schemaToZod).join(', ')}])`;
  }

  const types = schemaTypes(schema);
  const nullable = types.includes('null');
  const concreteTypes = types.filter(type => type !== 'null');
  const base = concreteTypes.length > 1
    ? `z.union([${concreteTypes.map(type => schemaToZod({ ...schema, type })).join(', ')}])`
    : (() => {
        switch (concreteTypes[0]) {
          case 'object': {
            const required = new Set(schema.required ?? []);
            const entries = Object.entries(schema.properties ?? {}).map(([key, propertySchema]) => {
              const property = required.has(key) ? schemaToZod(propertySchema) : `${schemaToZod(propertySchema)}.optional()`;
              return `  ${JSON.stringify(key)}: ${property}`;
            });
            return entries.length ? `z.object({\n${entries.join(',\n')}\n})` : 'z.record(z.string(), z.unknown())';
          }
          case 'array':
            return `z.array(${schemaToZod(schema.items ?? {})})`;
          case 'integer':
            return 'z.number().int()';
          case 'number':
            return 'z.number()';
          case 'boolean':
            return 'z.boolean()';
          case 'string': {
            const formatMethod = schema.format === 'email' ? '.email()'
              : schema.format === 'uuid' ? '.uuid()'
                : schema.format === 'uri' ? '.url()'
                  : schema.format === 'date-time' ? '.datetime()'
                    : '';
            return `z.string()${formatMethod}`;
          }
          case 'null':
            return 'z.null()';
          default:
            return 'z.unknown()';
        }
      })();

  return nullable ? `${base}.nullable()` : base;
};

export const generateZodSchema = (schema: TJsonSchema, rootName = 'GeneratedPayload'): string => {
  return `import { z } from 'zod';\n\nexport const ${pascalCase(rootName)}Schema = ${schemaToZod(schema)};\n\nexport type ${pascalCase(rootName)} = z.infer<typeof ${pascalCase(rootName)}Schema>;`;
};

export const generateContract = (value: JsonValue, rootName = 'GeneratedPayload'): TGeneratedContract => {
  const schema = generateJsonSchema(value, rootName);
  return {
    jsonSchema: JSON.stringify(schema, null, 2),
    typescript: generateTypeScriptInterfaces(schema, rootName),
    zod: generateZodSchema(schema, rootName),
  };
};
