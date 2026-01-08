export type TDataType = 'json' | 'xml';

export interface TErrorPosition {
  line: number;
  column: number;
}

export interface TEditorError {
  message: string;
  position: TErrorPosition | null;
}

export interface TEditorState {
  content: string;
  format: TDataType;
  error: TEditorError | null;
}

export interface IParseResult {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    line: number;
    column: number;
    snippet?: string;
  };
}

export interface IXmlParseResult extends IParseResult {
  name?: string;
  attributes?: Record<string, string>;
  children?: IXmlParseResult[];
}
