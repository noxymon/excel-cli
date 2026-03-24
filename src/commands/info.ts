import { type Sheet, type CellType } from '../reader/types.js';
import { indexToLetter } from '../reader/parser.js';

export interface InfoOptions {
  sheet?: string;
  json?: boolean;
}

function inferSheetColumnTypes(sheet: Sheet): Array<{ type: CellType; nullCount: number }> {
  return sheet.headers.map((_, colIdx) => {
    let nullCount = 0;
    const typeCounts: Record<string, number> = {};

    for (const row of sheet.rows) {
      const cell = row.cells[colIdx];
      if (!cell || cell.type === 'empty') {
        nullCount++;
      } else {
        typeCounts[cell.type] = (typeCounts[cell.type] ?? 0) + 1;
      }
    }

    // Pick dominant non-empty type
    const dominantType = (Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      'empty') as CellType;

    return { type: dominantType, nullCount };
  });
}

function printSheetInfo(sheet: Sheet, totalRows: number): void {
  process.stdout.write(`\nSheet: ${sheet.name} (${sheet.rows.length} rows × ${sheet.headers.length} cols)\n`);
  const colMeta = inferSheetColumnTypes(sheet);

  for (let i = 0; i < sheet.headers.length; i++) {
    const letter = indexToLetter(i).padEnd(4);
    const name = sheet.headers[i].substring(0, 24).padEnd(26);
    const type = (colMeta[i]?.type ?? 'empty').padEnd(10);
    const nulls = colMeta[i]?.nullCount ?? 0;
    process.stdout.write(`  ${letter} ${name} ${type} ${nulls} null${nulls !== 1 ? 's' : ''}\n`);
  }
}

export async function runInfo(filePath: string, opts: InfoOptions): Promise<void> {
  const { parseFile, resolveSheet } = await import('../reader/parser.js');
  const workbook = parseFile(filePath);
  const totalRows = workbook.sheets.reduce((acc, s) => acc + s.rows.length, 0);

  if (opts.json) {
    const data = {
      file: workbook.filename,
      format: workbook.format,
      sheets: workbook.sheets.map((sheet) => {
        const colMeta = inferSheetColumnTypes(sheet);
        return {
          index: sheet.index,
          name: sheet.name,
          rows: sheet.rows.length,
          cols: sheet.headers.length,
          columns: sheet.headers.map((name, i) => ({
            index: i,
            letter: indexToLetter(i),
            name,
            type: colMeta[i]?.type ?? 'empty',
            nullCount: colMeta[i]?.nullCount ?? 0,
          })),
        };
      }),
    };
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    return;
  }

  process.stdout.write(
    `File: ${workbook.filename} (${workbook.format}, ${workbook.sheets.length} sheet${workbook.sheets.length !== 1 ? 's' : ''})\n`,
  );

  if (opts.sheet) {
    printSheetInfo(resolveSheet(workbook, opts.sheet), totalRows);
  } else {
    for (const sheet of workbook.sheets) {
      printSheetInfo(sheet, totalRows);
    }
  }
  process.stdout.write('\n');
}
