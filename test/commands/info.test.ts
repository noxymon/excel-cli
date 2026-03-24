import { describe, it, expect } from 'vitest';
import { runInfo } from '../../src/commands/info.js';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '../fixtures');
const simple = join(fixturesDir, 'simple.xlsx');
const multi = join(fixturesDir, 'multi-sheet.xlsx');

function captureStdout(): { text: () => string; restore: () => void } {
  const chunks: string[] = [];
  const original = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  };
  return {
    text: () => chunks.join(''),
    restore: () => { process.stdout.write = original; },
  };
}

describe('runInfo', () => {
  it('outputs human-readable info for simple.xlsx', async () => {
    const cap = captureStdout();
    await runInfo(simple, {});
    cap.restore();
    const text = cap.text();
    expect(text).toContain('Sheet1');
    expect(text).toContain('5 rows');
    expect(text).toContain('3 cols');
    expect(text).toContain('Name');
    expect(text).toContain('Revenue');
    expect(text).toContain('Region');
  });

  it('outputs JSON with --json', async () => {
    const cap = captureStdout();
    await runInfo(simple, { json: true });
    cap.restore();
    const data = JSON.parse(cap.text());
    expect(data.format).toBe('xlsx');
    expect(data.sheets).toHaveLength(1);
    expect(data.sheets[0].columns).toHaveLength(3);
    expect(data.sheets[0].columns[0]).toMatchObject({ letter: 'A', name: 'Name', type: 'string' });
  });

  it('filters to specific sheet with --sheet', async () => {
    const cap = captureStdout();
    await runInfo(multi, { sheet: 'Countries' });
    cap.restore();
    const text = cap.text();
    expect(text).toContain('Countries');
    expect(text).not.toContain('Products');
  });
});
