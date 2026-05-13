import { useSettingsStore } from '@/stores/settingsStore';

const YANDEX_METRICA_ID = 106176490;
const YANDEX_METRICA_SCRIPT_ID = 'datatree-yandex-metrica';

type YandexMetrica = (counterId: number, method: string, ...params: unknown[]) => void;

type WindowWithYandexMetrica = Window & {
  ym?: YandexMetrica & { a?: unknown[]; l?: number };
};

let loadPromise: Promise<void> | null = null;
let isInitialized = false;

const getWindowWithMetrica = () => window as WindowWithYandexMetrica;

const loadYandexMetrica = () => {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  const win = getWindowWithMetrica();

  if (win.ym && isInitialized) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    if (!win.ym) {
      const queuedYm = ((...args: Parameters<YandexMetrica>) => {
        queuedYm.a = queuedYm.a || [];
        queuedYm.a.push(args);
      }) as YandexMetrica & { a?: unknown[]; l?: number };

      queuedYm.l = Date.now();
      win.ym = queuedYm;
    }

    const existingScript = document.getElementById(YANDEX_METRICA_SCRIPT_ID);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = YANDEX_METRICA_SCRIPT_ID;
    script.async = true;
    script.src = `https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRICA_ID}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Yandex Metrica'));
    document.head.appendChild(script);
  });

  return loadPromise;
};

const initAnalytics = async () => {
  const settingsStore = useSettingsStore();
  if (!settingsStore.settings.privacy.analyticsEnabled) return false;

  await loadYandexMetrica();
  const { ym } = getWindowWithMetrica();
  if (!ym) return false;

  if (!isInitialized) {
    ym(YANDEX_METRICA_ID, 'init', {
      ssr: true,
      ecommerce: 'dataLayer',
      accurateTrackBounce: true,
      trackLinks: true,
    });
    isInitialized = true;
  }

  return true;
};

/**
 * Composable for opt-in anonymized usage analytics.
 * Analytics code is not loaded until the user enables it in Settings.
 */
export default function useAnalytics() {
  const settingsStore = useSettingsStore();

  const isAnalyticsEnabled = () => settingsStore.settings.privacy.analyticsEnabled;

  const trackEvent = async (eventName: string, params: Record<string, unknown> = {}) => {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Event: ${eventName}`, params);
    }

    if (!isAnalyticsEnabled()) return;
    if (!(await initAnalytics())) return;

    getWindowWithMetrica().ym?.(YANDEX_METRICA_ID, 'reachGoal', eventName, params);
  };

  const trackPageView = async (url: string) => {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] PageView: ${url}`);
    }

    if (!isAnalyticsEnabled()) return;
    if (!(await initAnalytics())) return;

    getWindowWithMetrica().ym?.(YANDEX_METRICA_ID, 'hit', url);
  };

  return {
    trackEvent,
    trackPageView,
  };
}
