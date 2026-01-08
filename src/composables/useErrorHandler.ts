import { computed } from 'vue';
import { useAppStore } from '../stores/appStore';
import ErrorFormatter from '../utils/error-formatter';
import type { TParseError } from '../types/store';

export default function useErrorHandler() {
  const appStore = useAppStore();

  const enhancedErrors = computed<TParseError[]>(() => {
    return appStore.errors.map(err =>
      ErrorFormatter.enhance(err, appStore.rawInput, appStore.format)
    );
  });

  const applyFix = (error: TParseError) => {
    if (error.suggestion) {
      const fixedContent = error.suggestion.fix();
      appStore.setRawInput(fixedContent);
    }
  };

  const hasSuggestions = computed(() => {
    return enhancedErrors.value.some(err => !!err.suggestion);
  });

  return {
    enhancedErrors,
    applyFix,
    hasSuggestions
  };
}
