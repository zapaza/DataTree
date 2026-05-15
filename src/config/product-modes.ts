export type TProductMode = 'inspect' | 'validate' | 'compare' | 'transform';

export type TProductModeConfig = {
  id: TProductMode;
  labelKey: string;
  path: string;
  icon: string;
  inputLabelKey: string;
  outputLabelKey: string;
};

export const PRODUCT_MODES: TProductModeConfig[] = [
  {
    id: 'inspect',
    labelKey: 'modes.inspect.label',
    path: '/inspect',
    icon: 'i-carbon-tree-view',
    inputLabelKey: 'modes.inspect.input',
    outputLabelKey: 'modes.inspect.output',
  },
  {
    id: 'validate',
    labelKey: 'modes.validate.label',
    path: '/validate',
    icon: 'i-carbon-rule',
    inputLabelKey: 'modes.validate.input',
    outputLabelKey: 'modes.validate.output',
  },
  {
    id: 'compare',
    labelKey: 'modes.compare.label',
    path: '/compare',
    icon: 'i-carbon-compare',
    inputLabelKey: 'modes.compare.input',
    outputLabelKey: 'modes.compare.output',
  },
  {
    id: 'transform',
    labelKey: 'modes.transform.label',
    path: '/transform',
    icon: 'i-carbon-arrows-horizontal',
    inputLabelKey: 'modes.transform.input',
    outputLabelKey: 'modes.transform.output',
  },
];

export const DEFAULT_PRODUCT_MODE: TProductMode = 'inspect';

export const getProductModeByPath = (path: string): TProductModeConfig => {
  return PRODUCT_MODES.find(mode => mode.path === path) || PRODUCT_MODES[0]!;
};
