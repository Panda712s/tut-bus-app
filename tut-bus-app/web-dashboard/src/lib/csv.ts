/**
 * Minimal RFC 4180 CSV export - hand-rolled so we don't need a dependency for
 * something this small. Escapes a field only when it needs it (contains a
 * comma, quote, or newline), wrapping it in quotes and doubling any embedded
 * quotes.
 */
function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a CSV string from an array of row objects, using the keys of the
 * first row as the header line (in insertion order), then triggers a browser
 * download of it as `filename`.
 */
export function downloadCsv(filename: string, rows: Record<string, string | number>[]): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvField(row[h])).join(',')),
  ];
  // CSV per RFC 4180 uses CRLF line endings.
  const csv = lines.join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
