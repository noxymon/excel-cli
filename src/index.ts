import { Command } from 'commander';
import { runCat } from './commands/cat.js';
import { runSheets } from './commands/sheets.js';
import { runInfo } from './commands/info.js';
import { die } from './utils/errors.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
    ) as { version: string };
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

const program = new Command();

program
  .name('excel-cli')
  .description('Read Excel files (xlsx, xls, ods) and output as CSV')
  .version(getVersion(), '-v, --version')
  .helpOption('-h, --help');

// Default command: output as CSV (invoked when first arg is a file path)
function addCatOptions(cmd: Command): Command {
  return cmd
    .option('-s, --sheet <name|index>', 'sheet to output (default: first sheet)')
    .option('-S, --all-sheets', 'output all sheets')
    .option('-c, --columns <list>', 'columns to include (names, letters, indices, ranges)')
    .option('-r, --rows <range>', 'row range, e.g. 1-50, 10-, -20, 5')
    .option('-l, --limit <n>', 'max rows to output', parseInt)
    .option('-o, --offset <n>', 'skip first n data rows', parseInt)
    .option('--no-header', 'omit header row from output');
}

// `cat` subcommand (explicit alias)
const catCmd = new Command('cat')
  .description('Output sheet data as CSV (default command)')
  .argument('<file>', 'Excel file to read (use - for stdin)');

addCatOptions(catCmd).action(async (file: string, opts: Record<string, unknown>) => {
  await runCat(file, {
    sheet: opts['sheet'] as string | undefined,
    allSheets: opts['allSheets'] as boolean | undefined,
    columns: opts['columns'] as string | undefined,
    rows: opts['rows'] as string | undefined,
    limit: opts['limit'] as number | undefined,
    offset: opts['offset'] as number | undefined,
    noHeader: opts['header'] === false,
  });
});

program.addCommand(catCmd);

// `sheets` subcommand
program
  .command('sheets')
  .description('List all sheets in the workbook')
  .argument('<file>', 'Excel file to read')
  .option('--json', 'output as JSON')
  .action(async (file: string, opts: { json?: boolean }) => {
    await runSheets(file, opts);
  });

// `info` subcommand
program
  .command('info')
  .description('Show schema and metadata')
  .argument('<file>', 'Excel file to read')
  .option('-s, --sheet <name|index>', 'show info for a specific sheet only')
  .option('--json', 'output as JSON')
  .action(async (file: string, opts: { sheet?: string; json?: boolean }) => {
    await runInfo(file, opts);
  });

// Default behaviour: if first arg is a file (not a known subcommand), run cat
const args = process.argv.slice(2);
const knownSubcommands = ['cat', 'sheets', 'info', '--help', '-h', '--version', '-v'];

if (args.length > 0 && !knownSubcommands.includes(args[0]) && !args[0].startsWith('-')) {
  // Treat as: excel-cli [cat-options] <file>
  // We need to insert 'cat' so commander routes correctly
  process.argv.splice(2, 0, 'cat');
}

program.parseAsync(process.argv).catch((err: Error) => {
  die(err.message, 1);
});
