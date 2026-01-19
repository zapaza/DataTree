import type { TDiffResult, TDiffNode } from '@/types/diff';

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
    const headers = ['Path', 'Type', 'Old Value', 'New Value'];
    const rows = diffResult.changes
      .filter(change => change.type !== 'unchanged')
      .map(change => [
        `"${change.path}"`,
        `"${change.type}"`,
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
  public static toHTMLReport(diffResult: TDiffResult, leftTitle: string = 'Source A', rightTitle: string = 'Source B'): string {
    const stats = diffResult.stats;
    const changes = diffResult.changes.filter(c => c.type !== 'unchanged');

    const rows = changes.map(change => `
      <tr class="diff-row diff-${change.type}">
        <td class="path">${change.path}</td>
        <td class="type">${change.type}</td>
        <td class="old-value">${this.escapeHtml(this.stringifyValue(change.oldValue))}</td>
        <td class="new-value">${this.escapeHtml(this.stringifyValue(change.newValue))}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSON Diff Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; line-height: 1.5; color: #24292e; padding: 20px; max-width: 1200px; margin: 0 auto; }
        h1 { border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
        .stats { display: flex; gap: 20px; margin-bottom: 20px; }
        .stat-item { padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 14px; }
        .added { background-color: #dafbe1; color: #22863a; }
        .removed { background-color: #ffeef0; color: #cb2431; }
        .modified { background-color: #fff5b1; color: #b08800; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
        th, td { text-align: left; padding: 8px 12px; border: 1px solid #dfe2e5; }
        th { background-color: #f6f8fa; }
        .diff-added { background-color: #e6ffed; }
        .diff-removed { background-color: #ffeef0; }
        .diff-modified { background-color: #fffdef; }
        .path { font-family: monospace; font-weight: bold; color: #0366d6; }
        .old-value, .new-value { font-family: monospace; white-space: pre-wrap; word-break: break-all; }
    </style>
</head>
<body>
    <h1>JSON Diff Report</h1>
    <div class="stats">
        <div class="stat-item added">Added: ${stats.added}</div>
        <div class="stat-item removed">Removed: ${stats.removed}</div>
        <div class="stat-item modified">Modified: ${stats.modified}</div>
    </div>
    <table>
        <thead>
            <tr>
                <th>Path</th>
                <th>Type</th>
                <th>${leftTitle}</th>
                <th>${rightTitle}</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
</body>
</html>
    `;
  }

  private static stringifyValue(value: any): string {
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
