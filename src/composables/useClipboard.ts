import { ref } from 'vue';
import { translate } from '@/i18n';
import { useSettingsStore } from '@/stores/settingsStore';

interface TToast {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

const toast = ref<TToast>({
  show: false,
  message: '',
  type: 'success'
});

let toastTimeout: number | null = null;

export default function useClipboard() {
  const settingsStore = useSettingsStore();
  const t = (key: string) => translate(settingsStore.settings.locale, key);

  const copy = async (text: string, successMessage?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage ?? t('toast.copied'), 'success');
      return true;
    } catch (err) {
      console.error('Failed to copy: ', err);
      showToast(t('toast.copyFailed'), 'error');
      return false;
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toast.value = {
      show: true,
      message,
      type
    };

    toastTimeout = window.setTimeout(() => {
      toast.value.show = false;
    }, 3000);
  };

  return {
    copy,
    toast,
    showToast
  };
}
