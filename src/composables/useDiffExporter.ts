import { useDiffStore } from '@/stores/diffStore';
import DiffExporter from '@/utils/diff-algorithms/diff-exporter';
import FileUtils from '@/utils/file-utils';
import useClipboard from './useClipboard';
import { useI18n } from './useI18n';

/**
 * Composable for handling diff export actions.
 */
export default function useDiffExporter() {
  const diffStore = useDiffStore();
  const { showToast } = useClipboard();
  const { t, locale } = useI18n();

  /**
   * Exports diff results as JSON Patch (RFC 6902).
   */
  const exportAsJsonPatch = () => {
    if (!diffStore.diffResult) return;
    const content = DiffExporter.toJSONPatch(diffStore.diffResult);
    const fileName = `diff-patch-${Date.now()}.json`;
    FileUtils.saveFile(content, fileName, 'application/json');
    showToast(t('toast.jsonPatchExported'), 'success');
  };

  /**
   * Exports diff results as CSV.
   */
  const exportAsCSV = () => {
    if (!diffStore.diffResult) return;
    const content = DiffExporter.toCSV(diffStore.diffResult);
    const fileName = `diff-stats-${Date.now()}.csv`;
    FileUtils.saveFile(content, fileName, 'text/csv');
    showToast(t('toast.csvExported'), 'success');
  };

  /**
   * Exports diff results as Unified Diff (git diff).
   */
  const exportAsUnifiedDiff = () => {
    const content = DiffExporter.toUnifiedDiff(diffStore.left.raw, diffStore.right.raw);
    const fileName = `diff-${Date.now()}.patch`;
    FileUtils.saveFile(content, fileName, 'text/plain');
    showToast(t('toast.unifiedDiffExported'), 'success');
  };

  /**
   * Exports diff results as HTML Report.
   */
  const exportAsHTML = () => {
    if (!diffStore.diffResult) return;
    const content = DiffExporter.toHTMLReport(diffStore.diffResult, {
      locale: locale.value,
      title: t('diffReport.title'),
      sourceA: t('compare.sourceA'),
      sourceB: t('compare.sourceB'),
      filters: t('diffReport.filters'),
      all: t('diffReport.all'),
      warning: t('diffReport.warning'),
      added: t('compare.added'),
      removed: t('compare.removed'),
      modified: t('compare.modified'),
      breaking: t('compare.breaking'),
      nonBreaking: t('compare.nonBreaking'),
      warnings: t('compare.warnings'),
      summaryByPath: t('diffReport.summaryByPath'),
      valueChanges: t('diffReport.valueChanges'),
      contractDiff: t('diffReport.contractDiff'),
      path: t('common.path'),
      type: t('diffReport.type'),
      total: t('diffReport.total'),
      risk: t('diffReport.risk'),
      reason: t('diffReport.reason'),
      change: t('diffReport.change'),
      detail: t('diffReport.detail'),
      noContractChanges: t('diffReport.noContractChanges'),
    });
    const fileName = `diff-report-${Date.now()}.html`;
    FileUtils.saveFile(content, fileName, 'text/html');
    showToast(t('toast.htmlReportExported'), 'success');
  };

  return {
    exportAsJsonPatch,
    exportAsCSV,
    exportAsUnifiedDiff,
    exportAsHTML
  };
}
