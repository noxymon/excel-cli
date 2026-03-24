export interface SheetsOptions {
  json?: boolean;
}

export async function runSheets(filePath: string, opts: SheetsOptions): Promise<void> {
  const { parseFile } = await import('../reader/parser.js');
  const workbook = parseFile(filePath);

  if (opts.json) {
    const data = workbook.sheets.map((s) => ({
      index: s.index,
      name: s.name,
      rows: s.rows.length,
      cols: s.headers.length,
    }));
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  } else {
    for (const sheet of workbook.sheets) {
      process.stdout.write(sheet.name + '\n');
    }
  }
}
