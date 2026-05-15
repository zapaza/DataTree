import { defineStore } from 'pinia';
import { ref, shallowRef, computed, watch } from 'vue';
import debounce from '@/utils/debounce';
import type { TDataType } from '@/types/editor';
import type { TDocumentStatistics, TTreeNode, TParseError, TTreeFilters } from '../types/store';
import type { TContractIssue } from '@/types/contracts';
import JsonFormatter from '@/utils/transformers/json-formatters';
import JsonXmlConverter from '@/utils/transformers/json-xml-converter';
import {
  DEFAULT_TREE_FILTERS,
  persistDocumentState,
  persistTreeFilters,
  readStoredDocumentState,
  readStoredTreeFilters,
} from '@/stores/document/persistence';
import {
  DocumentParsePipeline,
  isParseCancelledError,
  type TWorkerParseResult,
} from '@/stores/document/parse-pipeline';
import {
  DocumentFilterPipeline,
  isFilterCancelledError,
} from '@/stores/document/filter-pipeline';
import { validateJsonSchema } from '@/utils/contracts/json-schema-validator';
import { treeNodeToValue } from '@/utils/tree-node-utils';
import { createDocumentStatistics } from '@/utils/statistics';

export const useDocumentStore = defineStore('document', () => {
  const storedDocument = readStoredDocumentState();
  const parsePipeline = new DocumentParsePipeline();
  const filterPipeline = new DocumentFilterPipeline();

  // State
  const rawInput = ref(storedDocument.rawInput);
  const format = ref<TDataType>(storedDocument.format);
  const parsedData = shallowRef<TTreeNode | null>(null);
  const filteredData = shallowRef<TTreeNode | null>(null);
  const errors = ref<TParseError[]>([]);
  const parseTime = ref(0);
  const statistics = ref<TDocumentStatistics>(
    createDocumentStatistics(null, storedDocument.rawInput.length, storedDocument.format, true, 0)
  );
  const filterTime = ref(0);
  const isParsing = ref(false);
  const isFiltering = ref(false);

  const validationSchema = ref('');
  const schemaErrors = ref<string[]>([]);
  const contractIssues = ref<TContractIssue[]>([]);
  const activeContractIssue = ref<TContractIssue | null>(null);

  const filters = ref<TTreeFilters>(readStoredTreeFilters());

  // Getters
  const isValid = computed(() => errors.value.length === 0);

  const treeSize = computed<number>(() => statistics.value.nodes);

  // Actions

  const setRawInput = (input: string) => {
    rawInput.value = input;
  };

  const getAdaptiveParseDelay = () => {
    const length = rawInput.value.length;
    if (length > 10 * 1024 * 1024) return 1200;
    if (length > 1 * 1024 * 1024) return 800;
    return 400;
  };

  const debouncedParseInput = debounce(() => parseInput(), getAdaptiveParseDelay);

  // Watch for input changes to sync with localStorage and parse
  watch([rawInput, format], () => {
    persistDocumentState({
      rawInput: rawInput.value,
      format: format.value,
    });
    debouncedParseInput();
  });

  watch(validationSchema, () => {
    validateSchema();
  });

  const setFormat = (newFormat: TDataType) => {
    format.value = newFormat;
  };

  const applyFilters = async () => {
    const sourceTree = parsedData.value;
    const activeFilters = filters.value;

    if (!sourceTree) {
      filterPipeline.cancelPending();
      filteredData.value = null;
      filterTime.value = 0;
      isFiltering.value = false;
      return;
    }

    isFiltering.value = true;

    try {
      const result = await filterPipeline.filter(sourceTree, activeFilters);
      if (sourceTree === parsedData.value && activeFilters === filters.value) {
        filteredData.value = result.data;
        filterTime.value = result.filterTime;
      }
    } catch (error: unknown) {
      if (!isFilterCancelledError(error)) {
        filteredData.value = sourceTree;
        filterTime.value = 0;
      }
    } finally {
      if (sourceTree === parsedData.value && activeFilters === filters.value) {
        isFiltering.value = false;
      }
    }
  };

  const debouncedApplyFilters = debounce(() => {
    void applyFilters();
  }, 80);

  const updateFilters = (newFilters: Partial<TTreeFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
    persistTreeFilters(filters.value);
    debouncedApplyFilters();
  };

  const resetFilters = () => {
    filters.value = { ...DEFAULT_TREE_FILTERS };
    persistTreeFilters(filters.value);
    debouncedApplyFilters();
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

  const sortKeys = () => {
    if (format.value === 'json') {
      const sorted = JsonFormatter.sortKeys(rawInput.value);
      if (sorted !== rawInput.value) {
        setRawInput(sorted);
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
    if (!validationSchema.value.trim()) {
      contractIssues.value = [];
      schemaErrors.value = [];
      activeContractIssue.value = null;
      return;
    }

    if (!parsedData.value) {
      contractIssues.value = [];
      schemaErrors.value = [];
      activeContractIssue.value = null;
      return;
    }

    contractIssues.value = validateJsonSchema(
      treeNodeToValue(parsedData.value),
      validationSchema.value,
      rawInput.value
    );
    schemaErrors.value = contractIssues.value.map(issue => `${issue.jsonPath}: ${issue.message}`);
    if (activeContractIssue.value && !contractIssues.value.some(issue => issue.id === activeContractIssue.value?.id)) {
      activeContractIssue.value = null;
    }
  };

  const setValidationSchema = (schema: string) => {
    validationSchema.value = schema;
  };

  const selectContractIssue = (issue: TContractIssue | null) => {
    activeContractIssue.value = issue;
  };

  const applyParseResult = (result: TWorkerParseResult) => {
    parseTime.value = result.parseTime;
    statistics.value = result.statistics;

    if (result.success) {
      errors.value = [];
      parsedData.value = result.data;
      filteredData.value = null;
      debouncedApplyFilters();
      validateSchema();
      return;
    }

    errors.value = result.error ? [result.error] : [];
    parsedData.value = null;
    filteredData.value = null;
    filterTime.value = 0;
    isFiltering.value = false;
    filterPipeline.cancelPending();
    validateSchema();
  };

  const parseInput = async () => {
    const input = rawInput.value;
    const activeFormat = format.value;

    if (!rawInput.value.trim()) {
      parsePipeline.cancelPending();
      parsedData.value = null;
      filteredData.value = null;
      errors.value = [];
      parseTime.value = 0;
      statistics.value = createDocumentStatistics(null, rawInput.value.length, format.value, true, 0);
      filterTime.value = 0;
      isParsing.value = false;
      isFiltering.value = false;
      filterPipeline.cancelPending();
      validateSchema();
      return;
    }

    isParsing.value = true;

    try {
      const result = await parsePipeline.parse(input, activeFormat);
      if (input === rawInput.value && activeFormat === format.value) {
        applyParseResult(result);
      }
    } catch (error: unknown) {
      if (!isParseCancelledError(error)) {
        errors.value = [{
          message: error instanceof Error ? error.message : 'Parsing failed',
          line: 1,
          column: 1,
          severity: 'error',
        }];
        parsedData.value = null;
        filteredData.value = null;
        statistics.value = createDocumentStatistics(null, input.length, activeFormat, false, 0);
        filterTime.value = 0;
        isFiltering.value = false;
        filterPipeline.cancelPending();
        validateSchema();
      }
    } finally {
      if (input === rawInput.value && activeFormat === format.value) {
        isParsing.value = false;
      }
    }
  };

  // Инициализация
  if (rawInput.value) {
    parseInput();
  }

  return {
    rawInput,
    format,
    parsedData,
    filteredData,
    errors,
    isParsing,
    isFiltering,
    filters,
    isValid,
    treeSize,
    statistics,
    filterTime,
    setRawInput,
    setFormat,
    updateFilters,
    resetFilters,
    formatJson,
    minifyJson,
    sortKeys,
    convertFormat,
    validateSchema,
    parseInput,
    setValidationSchema,
    selectContractIssue,
    validationSchema,
    schemaErrors,
    contractIssues,
    activeContractIssue
  };
});
