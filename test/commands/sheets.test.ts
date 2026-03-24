import { describe, it, expect } from 'vitest';
import { runSheets } from '../../src/commands/sheets.js';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '../fixtures');
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

describe('runSheets', () => {
  it('outputs sheet names one per line', async () => {
    const cap = captureStdout();
    await runSheets(multi, {});
    cap.restore();
    const lines = cap.text().trim().split('\n');
    expect(lines).toEqual(['Products', 'Countries', 'Summary']);
  });

  it('outputs JSON with --json', async () => {
    const cap = captureStdout();
    await runSheets(multi, { json: true });
    cap.restore();
    const data = JSON.parse(cap.text());
    expect(data).toHaveLength(3);
    expect(data[0]).toMatchObject({ index: 0, name: 'Products', rows: 2, cols: 2 });
    expect(data[1]).toMatchObject({ index: 1, name: 'Countries' });
  });
});
