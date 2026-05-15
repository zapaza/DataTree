import type { TLocale } from '@/types/store';
import { en } from './en';
import { ru } from './ru';

export const messages = {
  en,
  ru,
} as const;

export const AVAILABLE_LOCALES: TLocale[] = ['en', 'ru'];

export type TI18nKey = string;

type TParams = Record<string, string | number>;

const resolvePath = (source: unknown, path: string): string | null => {
  const value = path.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, source);

  return typeof value === 'string' ? value : null;
};

const interpolate = (message: string, params?: TParams): string => {
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
};

export const translate = (locale: TLocale, key: TI18nKey, params?: TParams): string => {
  const message = resolvePath(messages[locale], key)
    ?? resolvePath(messages.en, key)
    ?? key;

  return interpolate(message, params);
};
