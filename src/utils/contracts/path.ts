import PathUtils from '@/utils/path-utils';

export const makeIssueId = (prefix: string, pathSegments: string[], keyword?: string) => {
  return `${prefix}:${PathUtils.getNodePath(pathSegments, 'jsonpath')}:${keyword || 'check'}`;
};

export const jsonPointerToSegments = (pointer: string): string[] => {
  if (!pointer) return [];
  return pointer
    .split('/')
    .slice(1)
    .map(segment => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
};

export const segmentsToTreePath = (segments: string[]) => {
  return segments.reduce((path, segment) => `${path}.${Number.isInteger(Number(segment)) && String(Number(segment)) === segment ? `[${segment}]` : segment}`, 'root');
};

export const segmentsToJsonPath = (segments: string[]) => {
  return PathUtils.getNodePath(segments.map(segment => Number.isInteger(Number(segment)) && String(Number(segment)) === segment ? `[${segment}]` : segment), 'jsonpath');
};
