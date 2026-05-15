import { computed } from 'vue';
import { AVAILABLE_LOCALES, translate, type TI18nKey } from '@/i18n';
import { useSettingsStore } from '@/stores/settingsStore';
import type { TLocale } from '@/types/store';

type TParams = Record<string, string | number>;

export function useI18n() {
  const settingsStore = useSettingsStore();

  const locale = computed(() => settingsStore.settings.locale);

  const t = (key: TI18nKey, params?: TParams) => {
    return translate(locale.value, key, params);
  };

  const setLocale = (newLocale: TLocale) => {
    settingsStore.updateLocale(newLocale);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
  };

  return {
    availableLocales: AVAILABLE_LOCALES,
    locale,
    setLocale,
    t,
  };
}

export default useI18n;
