import type { TDataType } from '@/types/editor';

export const detectPayloadFormat = (content: string): TDataType => {
  const trimmed = content.trim();

  if (trimmed.startsWith('<')) {
    return 'xml';
  }

  return 'json';
};

export const isPayloadFormat = (value: string | null): value is TDataType => {
  return value === 'json' || value === 'xml';
};
