/**
 * Generic CSV export utility.
 * Generates a CSV string from an array of objects and triggers a browser download.
 */

interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

export function generateCsv<T>(data: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvField(c.header)).join(',');
  const rows = data.map((row) =>
    columns.map((c) => escapeCsvField(String(c.accessor(row) ?? ''))).join(','),
  );
  return [header, ...rows].join('\n');
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCsv(csvContent: string, filename: string): void {
  // BOM for proper Unicode (Bangla) display in Excel
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

