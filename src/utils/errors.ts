export class ExcelCliError extends Error {
  constructor(
    message: string,
    public readonly exitCode: 1 | 2 = 1,
  ) {
    super(message);
    this.name = 'ExcelCliError';
  }
}

export function die(message: string, exitCode: 1 | 2 = 1): never {
  process.stderr.write(`excel-cli: ${message}\n`);
  process.exit(exitCode);
}
