export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = JsonValue[];

export const isJsonObject = (value: unknown): value is JsonObject => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

