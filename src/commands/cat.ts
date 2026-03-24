import { type Sheet } from '../reader/types.js';
import { resolveColumns } from '../utils/columns.js';
import { parseRowRange, applyRowSelection, type RowRange } from '../utils/rows.js';
import { rowToCsv } from '../utils/csv.js';

export interface CatOptions {
  sheet?: string;
  allSheets?: boolean;
  columns?: string;
  rows?: string;
  limit?: number;
  offset?: number;
  noHeader?: boolean;
}

const TTY_WARN_THRESHOLD = 100;
const CRLF = '\r\n';

function writeSheetCsv(sheet: Sheet, opts: CatOptions): void {
  const { columns, rows, limit, offset, noHeader } = opts;

  let colIndices: number[] | undefined;
  if (columns) {
    colIndices = resolveColumns(columns, sheet.headers);
  }

  let rowRange: RowRange | undefined;
  if (rows) {
    rowRange = parseRowRange(rows);
  }

  const selectedRows = applyRowSelection(sheet.rows, rowRange, limit, offset);

  if (process.stdout.isTTY && selectedRows.length > TTY_WARN_THRESHOLD) {
    process.stderr.write(
      `excel-cli: ${selectedRows.length} rows — consider piping to | less or redirecting to a file\n`,
    );
  }

  if (!noHeader) {
    const headers = colIndices ? colIndices.map((i) => sheet.headers[i]) : sheet.headers;
    process.stdout.write(rowToCsv(headers) + CRLF);
  }

  for (const row of selectedRows) {
    const cells = colIndices ? colIndices.map((i) => row.cells[i]) : row.cells;
    process.stdout.write(rowToCsv(cells.map((c) => c?.rawValue ?? '')) + CRLF);
  }
}

export async function runCat(filePath: string, opts: CatOptions): Promise<void> {
  const { parseFile, resolveSheet } = await import('../reader/parser.js');
  const workbook = parseFile(filePath);

  if (opts.allSheets) {
    for (let i = 0; i < workbook.sheets.length; i++) {
      const sheet = workbook.sheets[i];
      process.stdout.write(`# Sheet: ${sheet.name}${CRLF}`);
      writeSheetCsv(sheet, opts);
      if (i < workbook.sheets.length - 1) {
        process.stdout.write(CRLF);
      }
    }
  } else {
    const sheet = resolveSheet(workbook, opts.sheet);
    writeSheetCsv(sheet, opts);
  }
}
