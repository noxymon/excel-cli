import { indexToLetter } from '../reader/parser.js';
import { die } from './errors.js';

function letterToIndex(letter: string): number {
  let result = 0;
  for (const ch of letter.toUpperCase()) {
    result = result * 26 + (ch.charCodeAt(0) - 64);
  }
  return result - 1; // 0-based
}

function isExcelLetter(s: string): boolean {
  // Excel column letters are 1-3 uppercase (or lowercase) alpha chars.
  // We restrict to <=3 chars to distinguish "A" from "name".
  return /^[A-Za-z]{1,3}$/.test(s);
}

function isNumber(s: string): boolean {
  return /^\d+$/.test(s);
}

/**
 * Resolve a -c column selector to a sorted list of 0-based column indices.
 *
 * Resolution order for each token (after splitting on commas):
 *   1. Header name match (case-insensitive) — checked FIRST
 *   2. Excel letter(s) up to 3 chars (A, B, AA, etc.)
 *   3. 1-based numeric index
 *   4. Error
 *
 * Range syntax "A-D" or "1-5" is also supported.
 */
export function resolveColumns(selector: string, headers: string[]): number[] {
  const indices = new Set<number>();

  for (const part of selector.split(',')) {
    const token = part.trim();
    if (!token) continue;

    // --- Range handling: "A-D" or "1-5" ---
    // Only treat as range if it contains exactly one "-" and neither half is a header name
    const dashIdx = token.indexOf('-');
    if (dashIdx > 0 && dashIdx === token.lastIndexOf('-')) {
      const startStr = token.slice(0, dashIdx).trim();
      const endStr = token.slice(dashIdx + 1).trim();

      const startHeaderIdx = headers.findIndex(
        (h) => h.toLowerCase() === startStr.toLowerCase(),
      );
      const endHeaderIdx = headers.findIndex(
        (h) => h.toLowerCase() === endStr.toLowerCase(),
      );

      // Letter range: A-D (no header names matched, both look like Excel letters)
      if (startHeaderIdx === -1 && endHeaderIdx === -1 && isExcelLetter(startStr) && isExcelLetter(endStr)) {
        const startIdx = letterToIndex(startStr);
        const endIdx = letterToIndex(endStr);
        for (let i = Math.min(startIdx, endIdx); i <= Math.max(startIdx, endIdx); i++) {
          if (i < headers.length) indices.add(i);
        }
        continue;
      }

      // Number range: 1-5
      if (startHeaderIdx === -1 && endHeaderIdx === -1 && isNumber(startStr) && isNumber(endStr)) {
        const startIdx = parseInt(startStr, 10) - 1;
        const endIdx = parseInt(endStr, 10) - 1;
        for (let i = Math.min(startIdx, endIdx); i <= Math.max(startIdx, endIdx); i++) {
          if (i >= 0 && i < headers.length) indices.add(i);
        }
        continue;
      }
    }

    // --- Single token resolution ---

    // 1. Header name match (case-insensitive) — highest priority
    const nameIdx = headers.findIndex((h) => h.toLowerCase() === token.toLowerCase());
    if (nameIdx !== -1) {
      indices.add(nameIdx);
      continue;
    }

    // 2. Excel letter(s) (max 3 chars, e.g. A, B, AA, ZZ)
    if (isExcelLetter(token)) {
      const idx = letterToIndex(token);
      if (idx >= 0 && idx < headers.length) {
        indices.add(idx);
      }
      continue;
    }

    // 3. 1-based numeric index
    if (isNumber(token)) {
      const idx = parseInt(token, 10) - 1;
      if (idx >= 0 && idx < headers.length) {
        indices.add(idx);
      }
      continue;
    }

    // 4. Unknown column
    die(
      `column not found: "${token}" (available: ${headers.map((h, i) => `${h}/${indexToLetter(i)}`).join(', ')})`,
      2,
    );
  }

  return [...indices].sort((a, b) => a - b);
}
