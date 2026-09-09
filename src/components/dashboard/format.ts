export const formatRupiah = (value: number, compact = false) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(value);

export const formatNumber = (value: number, digits = 1) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits }).format(value);

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));

export const downloadBlob = (content: BlobPart, filename: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const sanitizeSpreadsheetCell = (value: string | number): string | number => {
  if (typeof value !== "string") return value;
  // Spreadsheet programs may execute cells beginning with a formula marker.
  return /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value;
};

export const sanitizeSpreadsheetRows = (rows: Array<Record<string, string | number>>) =>
  rows.map((row) => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, sanitizeSpreadsheetCell(value)]),
  ));

export const toCsv = (rows: Array<Record<string, string | number>>) => {
  if (!rows.length) return "";
  const safeRows = sanitizeSpreadsheetRows(rows);
  const headers = Object.keys(safeRows[0]);
  const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return [headers.map(quote).join(","), ...safeRows.map((row) => headers.map((key) => quote(row[key])).join(","))].join("\n");
};

export const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
