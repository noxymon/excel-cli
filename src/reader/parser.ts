import * as XLSX from 'xlsx';
import { type Cell, type CellType, type Row, type Sheet, type Workbook } from './types.js';
import { die } from '../utils/errors.js';
import { existsSync, readFileSync, readSync } from 'node:fs';

export function indexToLetter(index: number): string {
  let result = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function inferType(value: unknown): CellType {
  if (value === null || value === undefined || value === '') return 'empty';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return 'string';
}

function cellToRaw(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function parseSheetData(ws: XLSX.WorkSheet, sheetName: string, sheetIndex: number): Sheet {
  const ref = ws['!ref'];
  if (!ref) {
    return { name: sheetName, index: sheetIndex, hidden: false, headers: [], rows: [] };
  }

  const range = XLSX.utils.decode_range(ref);
  const headers: string[] = [];

  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: range.s.r, c });
    const cell = ws[cellAddr] as XLSX.CellObject | undefined;
    const val = cell ? String(cell.v ?? '') : '';
    headers.push(val || indexToLetter(c - range.s.c));
  }

  const rows: Row[] = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const cells: Cell[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellAddr] as XLSX.CellObject | undefined;

      let value: Cell['value'] = null;
      if (cell?.v !== undefined && cell.v !== null) {
        if (cell.t === 'd') {
          value = cell.v instanceof Date ? cell.v : new Date(String(cell.v));
        } else if (cell.t === 'b') {
          value = Boolean(cell.v);
        } else if (cell.t === 'n') {
          value = Number(cell.v);
        } else {
          value = String(cell.v);
        }
      }

      cells.push({ value, rawValue: cellToRaw(value), type: inferType(value) });
    }

    while (cells.length < headers.length) {
      cells.push({ value: null, rawValue: '', type: 'empty' });
    }

    rows.push({ index: r - range.s.r, cells });
  }

  return { name: sheetName, index: sheetIndex, hidden: false, headers, rows };
}

function readStdin(): Buffer {
  const chunks: Buffer[] = [];
  const buf = Buffer.alloc(65536);
  let bytesRead: number;
  do {
    try {
      bytesRead = readSync(0, buf, 0, buf.length, null);
    } catch {
      bytesRead = 0;
    }
    if (bytesRead > 0) chunks.push(Buffer.from(buf.subarray(0, bytesRead)));
  } while (bytesRead > 0);
  return Buffer.concat(chunks);
}

export function parseFile(filePath: string): Workbook {
  if (filePath !== '-' && !existsSync(filePath)) {
    die(`file not found: ${filePath}`, 1);
  }

  let buffer: Buffer;
  try {
    buffer = filePath === '-' ? readStdin() : readFileSync(filePath);
  } catch (err) {
    die(`cannot read file "${filePath}": ${(err as Error).message}`, 1);
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  } catch (err) {
    die(`cannot parse "${filePath}": ${(err as Error).message}`, 1);
  }

  const sheets = workbook.SheetNames.map((name, idx) =>
    parseSheetData(workbook.Sheets[name], name, idx),
  );

  const ext =
    filePath === '-' ? 'unknown' : filePath.split('.').pop()?.toLowerCase() ?? 'unknown';

  return { filename: filePath, format: ext, sheets };
}

export function resolveSheet(workbook: Workbook, sheetArg: string | undefined): Sheet {
  if (sheetArg === undefined) return workbook.sheets[0];

  const byName = workbook.sheets.find((s) => s.name.toLowerCase() === sheetArg.toLowerCase());
  if (byName) return byName;

  const idx = parseInt(sheetArg, 10);
  if (!isNaN(idx)) {
    const byIdx = workbook.sheets[idx];
    if (byIdx) return byIdx;
    die(`sheet index ${idx} out of range (workbook has ${workbook.sheets.length} sheets)`, 2);
  }

  die(`sheet not found: "${sheetArg}"`, 2);
}
