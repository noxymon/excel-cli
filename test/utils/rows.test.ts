import { describe, it, expect } from 'vitest';
import { parseRowRange, applyRowSelection } from '../../src/utils/rows.js';
import type { Row } from '../../src/reader/types.js';

function makeRows(n: number): Row[] {
  return Array.from({ length: n }, (_, i) => ({
    index: i + 1,
    cells: [{ value: String(i + 1), rawValue: String(i + 1), type: 'string' as const }],
  }));
}

describe('parseRowRange', () => {
  it('parses "1-5" as 1-based inclusive range', () => {
    expect(parseRowRange('1-5')).toEqual({ start: 1, end: 5 });
  });

  it('parses "3-" (open end)', () => {
    expect(parseRowRange('3-')).toEqual({ start: 3, end: undefined });
  });

  it('parses "-5" (last 5) as negative sentinel', () => {
    expect(parseRowRange('-5')).toEqual({ start: undefined, end: -5 });
  });

  it('parses "3" (single row)', () => {
    expect(parseRowRange('3')).toEqual({ start: 3, end: 3 });
  });
});

describe('applyRowSelection', () => {
  const rows = makeRows(10);

  it('returns all rows with no range/limit/offset', () => {
    expect(applyRowSelection(rows, undefined, undefined, undefined)).toHaveLength(10);
  });

  it('applies numeric range 1-3', () => {
    const result = applyRowSelection(rows, { start: 1, end: 3 }, undefined, undefined);
    expect(result).toHaveLength(3);
    expect(result[0].index).toBe(1);
    expect(result[2].index).toBe(3);
  });

  it('applies last-N range (-3)', () => {
    const result = applyRowSelection(rows, { start: undefined, end: -3 }, undefined, undefined);
    expect(result).toHaveLength(3);
    expect(result[0].index).toBe(8);
  });

  it('applies limit', () => {
    expect(applyRowSelection(rows, undefined, 3, undefined)).toHaveLength(3);
  });

  it('applies offset', () => {
    const result = applyRowSelection(rows, undefined, undefined, 2);
    expect(result).toHaveLength(8);
    expect(result[0].index).toBe(3);
  });

  it('applies offset + limit together', () => {
    const result = applyRowSelection(rows, undefined, 3, 2);
    expect(result).toHaveLength(3);
    expect(result[0].index).toBe(3);
  });
});
