import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '../fixtures');

async function getParser() {
  return import('../../src/reader/parser.js');
}

describe('parseFile', () => {
  it('parses simple.xlsx correctly', async () => {
    const { parseFile } = await getParser();
    const wb = parseFile(join(fixturesDir, 'simple.xlsx'));
    expect(wb.sheets).toHaveLength(1);
    const sheet = wb.sheets[0];
    expect(sheet.name).toBe('Sheet1');
    expect(sheet.headers).toEqual(['Name', 'Revenue', 'Region']);
    expect(sheet.rows).toHaveLength(5);
    expect(sheet.rows[0].cells[0].rawValue).toBe('Acme');
    expect(sheet.rows[0].cells[1].rawValue).toBe('1500000');
  });

  it('parses multi-sheet.xlsx correctly', async () => {
    const { parseFile } = await getParser();
    const wb = parseFile(join(fixturesDir, 'multi-sheet.xlsx'));
    expect(wb.sheets).toHaveLength(3);
    expect(wb.sheets.map((s) => s.name)).toEqual(['Products', 'Countries', 'Summary']);
  });

  it('parses legacy.xls', async () => {
    const { parseFile } = await getParser();
    const wb = parseFile(join(fixturesDir, 'legacy.xls'));
    expect(wb.sheets[0].headers).toEqual(['Name', 'Revenue', 'Region']);
  });

  it('parses openoffice.ods', async () => {
    const { parseFile } = await getParser();
    const wb = parseFile(join(fixturesDir, 'openoffice.ods'));
    expect(wb.sheets[0].headers).toEqual(['Name', 'Revenue', 'Region']);
  });

  it('exits with code 1 for missing file', async () => {
    const { parseFile } = await getParser();
    expect(() => parseFile('/nonexistent/path.xlsx')).toThrow();
  });
});

describe('resolveSheet', () => {
  it('returns first sheet when no selector given', async () => {
    const { parseFile, resolveSheet } = await getParser();
    const wb = parseFile(join(fixturesDir, 'multi-sheet.xlsx'));
    const sheet = resolveSheet(wb, undefined);
    expect(sheet.name).toBe('Products');
  });

  it('resolves sheet by name case-insensitively', async () => {
    const { parseFile, resolveSheet } = await getParser();
    const wb = parseFile(join(fixturesDir, 'multi-sheet.xlsx'));
    const sheet = resolveSheet(wb, 'countries');
    expect(sheet.name).toBe('Countries');
  });

  it('resolves sheet by 0-based index string', async () => {
    const { parseFile, resolveSheet } = await getParser();
    const wb = parseFile(join(fixturesDir, 'multi-sheet.xlsx'));
    const sheet = resolveSheet(wb, '1');
    expect(sheet.name).toBe('Countries');
  });
});
