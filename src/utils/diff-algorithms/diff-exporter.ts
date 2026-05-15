import type { TDiffResult } from '@/types/diff';
import type { JsonValue } from '@/types/json';

type TDiffReportLabels = {
  locale: string;
  title: string;
  sourceA: string;
  sourceB: string;
  filters: string;
  all: string;
  warning: string;
  added: string;
  removed: string;
  modified: string;
  breaking: string;
  nonBreaking: string;
  warnings: string;
  summaryByPath: string;
  valueChanges: string;
  contractDiff: string;
  path: string;
  type: string;
  total: string;
  risk: string;
  reason: string;
  change: string;
  detail: string;
  noContractChanges: string;
};

const DEFAULT_REPORT_LABELS: TDiffReportLabels = {
  locale: 'en',
  title: 'JSON Diff Report',
  sourceA: 'Source A',
  sourceB: 'Source B',
  filters: 'Filters',
  all: 'All',
  warning: 'Warning',
  added: 'Added',
  removed: 'Removed',
  modified: 'Modified',
  breaking: 'Breaking',
  nonBreaking: 'Non-breaking',
  warnings: 'Warnings',
  summaryByPath: 'Summary by Path',
  valueChanges: 'Value Changes',
  contractDiff: 'Contract Diff',
  path: 'Path',
  type: 'Type',
  total: 'Total',
  risk: 'Risk',
  reason: 'Reason',
  change: 'Change',
  detail: 'Detail',
  noContractChanges: 'No contract changes.',
};

/**
 * Utility class for exporting diff results in various formats.
 */
export default class DiffExporter {
  /**
   * Generates a JSON Patch (RFC 6902) string.
   */
  public static toJSONPatch(diffResult: TDiffResult): string {
    return JSON.stringify(diffResult.patch, null, 2);
  }

  /**
   * Generates a CSV string representing the changes.
   */
  public static toCSV(diffResult: TDiffResult): string {
    const headers = ['Path', 'Display Path', 'Type', 'Risk', 'Reason', 'Old Value', 'New Value'];
    const rows = diffResult.changes
      .filter(change => change.type !== 'unchanged')
      .map(change => [
        `"${change.path}"`,
        `"${this.escapeCsv(change.displayPath ?? change.path)}"`,
        `"${change.type}"`,
        `"${change.risk ?? 'neutral'}"`,
        `"${this.escapeCsv(change.reason ?? '')}"`,
        `"${this.escapeCsv(this.stringifyValue(change.oldValue))}"`,
        `"${this.escapeCsv(this.stringifyValue(change.newValue))}"`
      ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Generates a Unified Diff (git diff style) string.
   * Note: This is a simplified version based on structural changes.
   */
  public static toUnifiedDiff(leftRaw: string, rightRaw: string, fileName: string = 'file.json'): string {
    // For a true unified diff, we should compare line by line.
    // Since we are in a web environment, we might want to use a simple implementation or a library.
    // But since I should avoid adding new dependencies if possible, I'll implement a basic line-by-line diff.
    const leftLines = this.formatJson(leftRaw).split('\n');
    const rightLines = this.formatJson(rightRaw).split('\n');

    // Very basic diff (not full LCS for lines, but good enough for simple export)
    // In a real scenario, we'd use something like 'diff' package.
    // For now, let's provide a header and a basic representation.
    let output = `--- a/${fileName}\n+++ b/${fileName}\n`;

    // Simple implementation: if we have the diffResult, we could try to map it,
    // but line-based diff is better for "unified diff" format.
    // I will use a simple line-by-line comparison for now.
    // TODO: Improve with LCS if needed.

    const maxLines = Math.max(leftLines.length, rightLines.length);
    for (let i = 0; i < maxLines; i++) {
        const leftLine = leftLines[i];
        const rightLine = rightLines[i];

        if (leftLine === rightLine) {
            output += ` ${leftLine}\n`;
        } else {
            if (leftLine !== undefined) output += `-${leftLine}\n`;
            if (rightLine !== undefined) output += `+${rightLine}\n`;
        }
    }

    return output;
  }

  /**
   * Generates a self-contained HTML report with syntax highlighting.
   */
  public static toHTMLReport(diffResult: TDiffResult, labels: Partial<TDiffReportLabels> = {}): string {
    const copy = { ...DEFAULT_REPORT_LABELS, ...labels };
    const stats = diffResult.stats;
    const changes = diffResult.changes.filter(c => c.type !== 'unchanged');
    const contractChanges = diffResult.contractDiff?.changes ?? [];
    const riskSummary = diffResult.riskSummary;

    const rows = changes.map(change => `
      <tr class="diff-row diff-${change.type} risk-${change.risk ?? 'neutral'}" data-type="${change.type}" data-risk="${change.risk ?? 'neutral'}">
        <td class="path">${this.escapeHtml(change.displayPath ?? change.path)}</td>
        <td class="type">${change.type}</td>
        <td><span class="badge risk-${change.risk ?? 'neutral'}">${change.risk ?? 'neutral'}</span></td>
        <td>${this.escapeHtml(change.reason ?? '')}</td>
        <td class="old-value">${this.escapeHtml(this.stringifyValue(change.oldValue))}</td>
        <td class="new-value">${this.escapeHtml(this.stringifyValue(change.newValue))}</td>
      </tr>
    `).join('');

    const groupRows = diffResult.pathSummary.map(group => `
      <tr>
        <td class="path">${this.escapeHtml(group.displayPath)}</td>
        <td>${group.total}</td>
        <td>${group.breaking}</td>
        <td>${group.nonBreaking}</td>
        <td>${group.warnings}</td>
      </tr>
    `).join('');

    const contractRows = contractChanges.map(change => `
      <tr class="risk-${change.risk}" data-risk="${change.risk}">
        <td class="path">${this.escapeHtml(change.displayPath)}</td>
        <td><span class="badge risk-${change.risk}">${change.risk}</span></td>
        <td>${this.escapeHtml(change.title)}</td>
        <td>${this.escapeHtml(change.detail)}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="${this.escapeHtml(copy.locale)}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(copy.title)}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; line-height: 1.5; color: #24292e; padding: 20px; max-width: 1280px; margin: 0 auto; }
        h1 { border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
        h2 { margin-top: 32px; }
        .stats { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .stat-item { padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 14px; }
        .added { background-color: #dafbe1; color: #22863a; }
        .removed { background-color: #ffeef0; color: #cb2431; }
        .modified { background-color: #fff5b1; color: #b08800; }
        .breaking { background-color: #ffeef0; color: #cb2431; }
        .non-breaking { background-color: #dafbe1; color: #22863a; }
        .warning { background-color: #fff5b1; color: #9a6700; }
        .neutral { background-color: #eef2ff; color: #3b49df; }
        .filters { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0; }
        .filters button { border: 1px solid #d0d7de; background: #fff; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
        .filters button.active { background: #0969da; color: #fff; border-color: #0969da; }
        .badge { display: inline-flex; border-radius: 999px; padding: 2px 8px; font-size: 11px; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
        th, td { text-align: left; padding: 8px 12px; border: 1px solid #dfe2e5; }
        th { background-color: #f6f8fa; }
        .diff-added { background-color: #e6ffed; }
        .diff-removed { background-color: #ffeef0; }
        .diff-modified { background-color: #fffdef; }
        .path { font-family: monospace; font-weight: bold; color: #0366d6; }
        .old-value, .new-value { font-family: monospace; white-space: pre-wrap; word-break: break-all; max-width: 360px; }
        .hidden { display: none; }
    </style>
</head>
<body>
    <h1>${this.escapeHtml(copy.title)}</h1>
    <div class="stats">
        <div class="stat-item added">${this.escapeHtml(copy.added)}: ${stats.added}</div>
        <div class="stat-item removed">${this.escapeHtml(copy.removed)}: ${stats.removed}</div>
        <div class="stat-item modified">${this.escapeHtml(copy.modified)}: ${stats.modified}</div>
        <div class="stat-item breaking">${this.escapeHtml(copy.breaking)}: ${riskSummary.breaking}</div>
        <div class="stat-item non-breaking">${this.escapeHtml(copy.nonBreaking)}: ${riskSummary.nonBreaking}</div>
        <div class="stat-item warning">${this.escapeHtml(copy.warnings)}: ${riskSummary.warnings}</div>
    </div>
    <div class="filters" aria-label="${this.escapeHtml(copy.filters)}">
        <button class="active" data-filter="all">${this.escapeHtml(copy.all)}</button>
        <button data-filter="breaking">${this.escapeHtml(copy.breaking)}</button>
        <button data-filter="non-breaking">${this.escapeHtml(copy.nonBreaking)}</button>
        <button data-filter="warning">${this.escapeHtml(copy.warning)}</button>
        <button data-filter="added">${this.escapeHtml(copy.added)}</button>
        <button data-filter="removed">${this.escapeHtml(copy.removed)}</button>
        <button data-filter="modified">${this.escapeHtml(copy.modified)}</button>
    </div>
    <h2>${this.escapeHtml(copy.summaryByPath)}</h2>
    <table>
      <thead>
        <tr>
          <th>${this.escapeHtml(copy.path)}</th>
          <th>${this.escapeHtml(copy.total)}</th>
          <th>${this.escapeHtml(copy.breaking)}</th>
          <th>${this.escapeHtml(copy.nonBreaking)}</th>
          <th>${this.escapeHtml(copy.warnings)}</th>
        </tr>
      </thead>
      <tbody>${groupRows}</tbody>
    </table>
    <h2>${this.escapeHtml(copy.valueChanges)}</h2>
    <table>
        <thead>
            <tr>
                <th>${this.escapeHtml(copy.path)}</th>
                <th>${this.escapeHtml(copy.type)}</th>
                <th>${this.escapeHtml(copy.risk)}</th>
                <th>${this.escapeHtml(copy.reason)}</th>
                <th>${this.escapeHtml(copy.sourceA)}</th>
                <th>${this.escapeHtml(copy.sourceB)}</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
    <h2>${this.escapeHtml(copy.contractDiff)}</h2>
    <table>
      <thead>
        <tr>
          <th>${this.escapeHtml(copy.path)}</th>
          <th>${this.escapeHtml(copy.risk)}</th>
          <th>${this.escapeHtml(copy.change)}</th>
          <th>${this.escapeHtml(copy.detail)}</th>
        </tr>
      </thead>
      <tbody>${contractRows || `<tr><td colspan="4">${this.escapeHtml(copy.noContractChanges)}</td></tr>`}</tbody>
    </table>
    <script>
      const buttons = document.querySelectorAll('[data-filter]');
      const rows = document.querySelectorAll('.diff-row');
      buttons.forEach((button) => {
        button.addEventListener('click', () => {
          const filter = button.getAttribute('data-filter');
          buttons.forEach(item => item.classList.remove('active'));
          button.classList.add('active');
          rows.forEach((row) => {
            const visible = filter === 'all' || row.getAttribute('data-risk') === filter || row.getAttribute('data-type') === filter;
            row.classList.toggle('hidden', !visible);
          });
        });
      });
    </script>
</body>
</html>
    `;
  }

  private static stringifyValue(value: JsonValue | undefined): string {
    if (value === undefined) return '';
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  private static escapeCsv(str: string): string {
    return str.replace(/"/g, '""');
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private static formatJson(raw: string): string {
    try {
        return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
        return raw;
    }
  }
}
