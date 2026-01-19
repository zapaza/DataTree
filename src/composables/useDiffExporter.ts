import { useDiffStore } from '@/stores/diffStore';
import DiffExporter from '@/utils/diff-algorithms/diff-exporter';
import FileUtils from '@/utils/file-utils';
import useClipboard from './useClipboard';

/**
 * Composable for handling diff export actions.
 */
export default function useDiffExporter() {
  const diffStore = useDiffStore();
  const { showToast } = useClipboard();

  /**
   * Exports diff results as JSON Patch (RFC 6902).
   */
  const exportAsJsonPatch = () => {
    if (!diffStore.diffResult) return;
    const content = DiffExporter.toJSONPatch(diffStore.diffResult);
    const fileName = `diff-patch-${Date.now()}.json`;
    FileUtils.saveFile(content, fileName, 'application/json');
    showToast('Exported as JSON Patch', 'success');
  };

  /**
   * Exports diff results as CSV.
   */
  const exportAsCSV = () => {
    if (!diffStore.diffResult) return;
    const content = DiffExporter.toCSV(diffStore.diffResult);
    const fileName = `diff-stats-${Date.now()}.csv`;
    FileUtils.saveFile(content, fileName, 'text/csv');
    showToast('Exported as CSV', 'success');
  };

  /**
   * Exports diff results as Unified Diff (git diff).
   */
  const exportAsUnifiedDiff = () => {
    const content = DiffExporter.toUnifiedDiff(diffStore.left.raw, diffStore.right.raw);
    const fileName = `diff-${Date.now()}.patch`;
    FileUtils.saveFile(content, fileName, 'text/plain');
    showToast('Exported as Unified Diff', 'success');
  };

  /**
   * Exports diff results as HTML Report.
   */
  const exportAsHTML = () => {
    if (!diffStore.diffResult) return;
    const content = DiffExporter.toHTMLReport(diffStore.diffResult);
    const fileName = `diff-report-${Date.now()}.html`;
    FileUtils.saveFile(content, fileName, 'text/html');
    showToast('Exported as HTML Report', 'success');
  };

  return {
    exportAsJsonPatch,
    exportAsCSV,
    exportAsUnifiedDiff,
    exportAsHTML
  };
}
