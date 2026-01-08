/**
 * Composable for tracking anonymized application analytics.
 * Uses Yandex Metrica (if configured) or simple console logging in development.
 */
export default function useAnalytics() {
  /**
   * Tracks a custom event.
   * @param eventName - The name of the event to track.
   * @param params - Additional parameters for the event.
   */
  const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Event: ${eventName}`, params);
    }

    if (typeof window !== 'undefined' && (window as any).ym) {
      (window as any).ym(106176490, 'reachGoal', eventName, params);
    }
  };

  /**
   * Tracks a page view.
   * @param url - The URL of the page viewed.
   */
  const trackPageView = (url: string) => {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] PageView: ${url}`);
    }

    if (typeof window !== 'undefined' && (window as any).ym) {
      (window as any).ym(106176490, 'hit', url);
    }
  };

  return {
    trackEvent,
    trackPageView
  };
}
