import type { ImportRecord } from "../types";

export async function parseExcel(buffer: ArrayBuffer): Promise<readonly ImportRecord[]> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as Parameters<typeof workbook.xlsx.load>[0]);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, column) => {
    headers[column - 1] = cellText(cell.value).trim();
  });
  const records: ImportRecord[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, unknown> = {};
    let populated = false;
    headers.forEach((header, index) => {
      if (!header) return;
      const value = cellText(row.getCell(index + 1).value);
      if (value.trim()) populated = true;
      record[header] = value;
    });
    if (populated) records.push(record);
  });
  return records;
}

function cellText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value) return cellText(value.result);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part: unknown) =>
        typeof part === "object" && part !== null && "text" in part ? String(part.text) : ""
      ).join("");
    }
  }
  return String(value);
}
