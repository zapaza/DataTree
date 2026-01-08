import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { TDataType } from '@/types/editor';
import type { TTreeNode, TParseError, TTreeFilters } from '../types/store';
import TreeTransformer from '@/utils/tree-transformer';
import TreeFilter from '@/utils/tree-filter';
import JsonFormatter from '@/utils/transformers/json-formatters';
import JsonXmlConverter from '@/utils/transformers/json-xml-converter';
import SchemaValidator from '@/utils/transformers/schema-validator';
import StatisticsCalculator from '@/utils/statistics';

const STORAGE_KEY_INPUT = 'datatree_raw_input';
const STORAGE_KEY_FILTERS = 'datatree_filters';

export const useAppStore = defineStore('app', () => {
  // State
  const rawInput = ref(localStorage.getItem(STORAGE_KEY_INPUT) || '');
  const format = ref<TDataType>('json');
  const parsedData = ref<TTreeNode | null>(null);
  const errors = ref<TParseError[]>([]);
  const parseTime = ref(0);
  const isParsing = ref(false);

  let parserWorker: Worker | null = null;

  // Схема для валидации
  const validationSchema = ref('');
  const schemaErrors = ref<string[]>([]);

  const filters = ref<TTreeFilters>(JSON.parse(localStorage.getItem(STORAGE_KEY_FILTERS) || JSON.stringify({
    hideNull: false,
    hideEmptyArrays: false,
    hideEmptyObjects: false,
    hideTypes: [],
    maxDepth: 20
  })));

  // Getters
  const isValid = computed(() => errors.value.length === 0);

  const treeSize = computed(() => TreeTransformer.countNodes(parsedData.value));

  const filteredData = computed(() => {
    if (!parsedData.value) return null;
    return TreeFilter.filter(parsedData.value, filters.value);
  });

  const statistics = computed(() => {
    return StatisticsCalculator.calculate(
      parsedData.value,
      rawInput.value.length,
      format.value,
      isValid.value,
      parseTime.value
    );
  });

  // Actions

  const setRawInput = (input: string) => {
    rawInput.value = input;
  };

  // Watch for input changes to sync with localStorage and parse
  watch([rawInput, format], () => {
    localStorage.setItem(STORAGE_KEY_INPUT, rawInput.value);
    parseInput();
  });

  const setFormat = (newFormat: TDataType) => {
    format.value = newFormat;
  };

  const updateFilters = (newFilters: Partial<TTreeFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters.value));
  };

  const resetFilters = () => {
    filters.value = {
      hideNull: false,
      hideEmptyArrays: false,
      hideEmptyObjects: false,
      hideTypes: [],
      maxDepth: 20
    };
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters.value));
  };

  const formatJson = () => {
    if (format.value === 'json') {
      const formatted = JsonFormatter.format(rawInput.value);
      if (formatted !== rawInput.value) {
        setRawInput(formatted);
      }
    }
  };

  const minifyJson = () => {
    if (format.value === 'json') {
      const minified = JsonFormatter.minify(rawInput.value);
      if (minified !== rawInput.value) {
        setRawInput(minified);
      }
    }
  };

  const convertFormat = () => {
    let converted: string | null = null;
    let newFormat: TDataType = format.value;

    if (format.value === 'json') {
      converted = JsonXmlConverter.jsonToXml(rawInput.value);
      newFormat = 'xml';
    } else {
      converted = JsonXmlConverter.xmlToJson(rawInput.value);
      newFormat = 'json';
    }

    if (converted) {
      setRawInput(converted);
      setFormat(newFormat);
    }
  };

  const validateSchema = () => {
    if (!parsedData.value || !validationSchema.value) {
      schemaErrors.value = [];
      return;
    }

    const result = SchemaValidator.validate(
      // Нам нужен чистый объект данных для валидации Zod, а не TTreeNode
      JSON.parse(JSON.stringify(getRawData(parsedData.value))),
      validationSchema.value
    );

    schemaErrors.value = result.success ? [] : (result.errors || []);
  };

  const getRawData = (node: TTreeNode): any => {
    if (node.type === 'object') {
      const obj: any = {};
      node.children?.forEach(child => {
        obj[child.key] = getRawData(child);
      });
      return obj;
    } else if (node.type === 'array') {
      return node.children?.map(child => getRawData(child)) || [];
    }
    return node.value;
  };

  const parseInput = () => {
    if (!rawInput.value.trim()) {
      parsedData.value = null;
      errors.value = [];
      isParsing.value = false;
      return;
    }

    isParsing.value = true;

    if (parserWorker) {
      parserWorker.terminate();
    }

    // Инициализация воркера (Vite способ)
    parserWorker = new Worker(new URL('../workers/parser.worker.ts', import.meta.url), {
      type: 'module'
    });

    parserWorker.onmessage = (e) => {
      const { success, data, error, parseTime: time } = e.data;

      parseTime.value = time;
      if (success) {
        errors.value = [];
        parsedData.value = data;
      } else if (error) {
        errors.value = [{
          message: error.message,
          line: error.line,
          column: error.column,
          snippet: error.snippet,
          severity: 'error'
        }];
        parsedData.value = null;
      }
      isParsing.value = false;
      parserWorker?.terminate();
      parserWorker = null;
    };

    parserWorker.onerror = (e) => {
      console.error('Worker error:', e);
      errors.value = [{
        message: 'Parsing worker error',
        line: 1,
        column: 1,
        severity: 'error'
      }];
      isParsing.value = false;
      parserWorker?.terminate();
      parserWorker = null;
    };

    parserWorker.postMessage({
      input: rawInput.value,
      format: format.value
    });
  };

  // Инициализация
  if (rawInput.value) {
    parseInput();
  }

  return {
    rawInput,
    format,
    parsedData,
    errors,
    isParsing,
    filters,
    isValid,
    treeSize,
    filteredData,
    statistics,
    setRawInput,
    setFormat,
    updateFilters,
    resetFilters,
    formatJson,
    minifyJson,
    convertFormat,
    validateSchema,
    parseInput,
    validationSchema,
    schemaErrors
  };
});
