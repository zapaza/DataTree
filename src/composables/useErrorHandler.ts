import { computed } from 'vue';
import { useDocumentStore } from '../stores/documentStore';
import ErrorFormatter from '../utils/error-formatter';
import type { TParseError } from '../types/store';

export default function useErrorHandler() {
  const documentStore = useDocumentStore();

  const enhancedErrors = computed<TParseError[]>(() => {
    return documentStore.errors.map(err =>
      ErrorFormatter.enhance(err, documentStore.rawInput, documentStore.format)
    );
  });

  const applyFix = (error: TParseError) => {
    if (error.suggestion) {
      const fixedContent = error.suggestion.fix();
      documentStore.setRawInput(fixedContent);
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
