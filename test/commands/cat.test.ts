import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runCat } from '../../src/commands/cat.js';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '../fixtures');
const simple = join(fixturesDir, 'simple.xlsx');
const multi = join(fixturesDir, 'multi-sheet.xlsx');

function captureStdout(): { lines: () => string[]; restore: () => void } {
  const chunks: string[] = [];
  const original = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  };
  return {
    lines: () => chunks.join('').replace(/\r\n/g, '\n').trim().split('\n'),
    restore: () => { process.stdout.write = original; },
  };
}

describe('runCat', () => {
  it('outputs all rows with header by default', async () => {
    const cap = captureStdout();
    await runCat(simple, {});
    cap.restore();
    const lines = cap.lines();
    expect(lines[0]).toBe('Name,Revenue,Region');
    expect(lines).toHaveLength(6); // 1 header + 5 data rows
  });

  it('omits header with noHeader=true', async () => {
    const cap = captureStdout();
    await runCat(simple, { noHeader: true });
    cap.restore();
    const lines = cap.lines();
    expect(lines[0]).toBe('Acme,1500000,North');
    expect(lines).toHaveLength(5);
  });

  it('selects columns by name', async () => {
    const cap = captureStdout();
    await runCat(simple, { columns: 'name,region' });
    cap.restore();
    const lines = cap.lines();
    expect(lines[0]).toBe('Name,Region');
    expect(lines[1]).toBe('Acme,North');
  });

  it('selects columns by Excel letter', async () => {
    const cap = captureStdout();
    await runCat(simple, { columns: 'A,C' });
    cap.restore();
    expect(cap.lines()[0]).toBe('Name,Region');
  });

  it('applies row limit', async () => {
    const cap = captureStdout();
    await runCat(simple, { limit: 2 });
    cap.restore();
    expect(cap.lines()).toHaveLength(3); // header + 2
  });

  it('applies offset', async () => {
    const cap = captureStdout();
    await runCat(simple, { offset: 2 });
    cap.restore();
    const lines = cap.lines();
    expect(lines[0]).toBe('Name,Revenue,Region');
    expect(lines[1]).toBe('Initech,450000,East');
    expect(lines).toHaveLength(4); // header + 3 remaining
  });

  it('applies row range', async () => {
    const cap = captureStdout();
    await runCat(simple, { rows: '1-2' });
    cap.restore();
    expect(cap.lines()).toHaveLength(3); // header + 2
  });

  it('selects sheet by name', async () => {
    const cap = captureStdout();
    await runCat(multi, { sheet: 'Countries' });
    cap.restore();
    expect(cap.lines()[0]).toBe('Country,Code');
  });

  it('outputs all sheets with --all-sheets', async () => {
    const cap = captureStdout();
    await runCat(multi, { allSheets: true });
    cap.restore();
    const output = cap.lines().join('\n');
    expect(output).toContain('# Sheet: Products');
    expect(output).toContain('# Sheet: Countries');
    expect(output).toContain('# Sheet: Summary');
  });
});
