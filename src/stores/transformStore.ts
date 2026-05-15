import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TRedactOptions, TTransformTool, TXmlTransformOptions } from '@/utils/transformers/transform-tools';

export const useTransformStore = defineStore('transform', () => {
  const selectedTool = ref<TTransformTool>('formatJson');

  const xmlOptions = ref<TXmlTransformOptions>({
    rootName: 'root',
    attributePrefix: '@_',
    textNodeName: '#text',
    format: true,
  });

  const redactOptions = ref<TRedactOptions>({
    commonKeys: true,
    customKeys: '',
    mask: '[REDACTED]',
  });

  const setTool = (tool: TTransformTool) => {
    selectedTool.value = tool;
  };

  const updateXmlOptions = (options: Partial<TXmlTransformOptions>) => {
    xmlOptions.value = { ...xmlOptions.value, ...options };
  };

  const updateRedactOptions = (options: Partial<TRedactOptions>) => {
    redactOptions.value = { ...redactOptions.value, ...options };
  };

  return {
    selectedTool,
    xmlOptions,
    redactOptions,
    setTool,
    updateXmlOptions,
    updateRedactOptions,
  };
});
