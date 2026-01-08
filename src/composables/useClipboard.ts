import { ref } from 'vue';

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
  const copy = async (text: string, successMessage: string = 'Copied to clipboard!') => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage, 'success');
      return true;
    } catch (err) {
      console.error('Failed to copy: ', err);
      showToast('Failed to copy to clipboard', 'error');
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
