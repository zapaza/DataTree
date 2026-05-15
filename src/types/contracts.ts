import type { JsonObject, JsonValue } from '@/types/json';

export type TContractSeverity = 'error' | 'warning' | 'info';

export type TJsonSchema = JsonObject & {
  $schema?: string;
  title?: string;
  type?: string | string[];
  properties?: Record<string, TJsonSchema>;
  items?: TJsonSchema;
  required?: string[];
  anyOf?: TJsonSchema[];
  enum?: JsonValue[];
  format?: string;
  additionalProperties?: boolean;
};

export type TGeneratedContract = {
  jsonSchema: string;
  typescript: string;
  zod: string;
};

export type TContractIssue = {
  id: string;
  severity: TContractSeverity;
  title: string;
  message: string;
  path: string;
  jsonPath: string;
  pathSegments: string[];
  keyword?: string;
  line?: number;
  column?: number;
};

export type TContractCheck = {
  id: string;
  severity: TContractSeverity;
  title: string;
  detail: string;
  path: string;
  jsonPath: string;
  pathSegments: string[];
};
