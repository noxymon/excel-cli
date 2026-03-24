import { type Row } from '../reader/types.js';
import { die } from './errors.js';

/**
 * Parse a row range string into start/end indices (1-based, inclusive).
 * Supports: "1-100", "50-", "-20", "5"
 * Returns { start, end } where undefined means open-ended.
 */
export interface RowRange {
  start?: number; // 1-based, inclusive
  end?: number;   // 1-based, inclusive
}

export function parseRowRange(range: string): RowRange {
  const trimmed = range.trim();

  // "-20" — last 20 rows (negative suffix handled at apply time)
  if (trimmed.startsWith('-') && !trimmed.slice(1).includes('-')) {
    const n = parseInt(trimmed.slice(1), 10);
    if (isNaN(n) || n <= 0) die(`invalid row range: "${range}"`, 2);
    return { end: -n }; // special sentinel: negative = last N
  }

  const parts = trimmed.split('-');

  // "5" — single row
  if (parts.length === 1) {
    const n = parseInt(parts[0], 10);
    if (isNaN(n) || n <= 0) die(`invalid row range: "${range}"`, 2);
    return { start: n, end: n };
  }

  if (parts.length === 2) {
    const startStr = parts[0].trim();
    const endStr = parts[1].trim();

    const start = startStr === '' ? undefined : parseInt(startStr, 10);
    const end = endStr === '' ? undefined : parseInt(endStr, 10);

    if (start !== undefined && (isNaN(start) || start <= 0)) die(`invalid row range: "${range}"`, 2);
    if (end !== undefined && (isNaN(end) || end <= 0)) die(`invalid row range: "${range}"`, 2);

    return { start, end };
  }

  die(`invalid row range: "${range}"`, 2);
}

/**
 * Apply row range + limit + offset to a list of rows.
 */
export function applyRowSelection(
  rows: Row[],
  range: RowRange | undefined,
  limit: number | undefined,
  offset: number | undefined,
): Row[] {
  let result = rows;

  if (range) {
    if (typeof range.end === 'number' && range.end < 0) {
      // Last N rows
      const n = -range.end;
      result = result.slice(Math.max(0, result.length - n));
    } else {
      const start = (range.start ?? 1) - 1;           // convert to 0-based
      const end = range.end !== undefined ? range.end : result.length; // inclusive 1-based
      result = result.slice(start, end);
    }
  }

  if (offset && offset > 0) {
    result = result.slice(offset);
  }

  if (limit && limit > 0) {
    result = result.slice(0, limit);
  }

  return result;
}
