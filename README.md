# excel-cli

Read Excel files (xlsx, xls, ods) and output as CSV in the terminal. Pipe-friendly and composable with standard Unix tools.

## Install

```bash
npm install -g excel-cli
```

Requires Node.js 18+.

## Usage

```bash
# Output as CSV (default)
excel-cli report.xlsx

# Select specific sheet
excel-cli report.xlsx -s "Q1 Sales"
excel-cli report.xlsx -s 1              # by 0-based index

# Output all sheets
excel-cli report.xlsx -S

# Select columns (by name, letter, index, or range)
excel-cli report.xlsx -c "name,revenue"
excel-cli report.xlsx -c "A,C"
excel-cli report.xlsx -c "A-D"
excel-cli report.xlsx -c "1,3,5"

# Row filtering
excel-cli report.xlsx -r "1-100"        # rows 1-100
excel-cli report.xlsx -r "50-"          # row 50 to end
excel-cli report.xlsx -r "-20"          # last 20 rows
excel-cli report.xlsx -l 10             # limit to 10 rows
excel-cli report.xlsx -o 5 -l 10        # skip 5, then take 10

# Omit header row
excel-cli report.xlsx --no-header

# Pipe to other tools
excel-cli report.xlsx | grep "North"
excel-cli report.xlsx | wc -l
excel-cli report.xlsx > output.csv
```

### List sheets

```bash
excel-cli sheets report.xlsx
excel-cli sheets report.xlsx --json
```

### Inspect schema

```bash
excel-cli info report.xlsx
excel-cli info report.xlsx --json
excel-cli info report.xlsx -s "Sheet1"
```

## Options

| Option | Description |
|---|---|
| `-s, --sheet <name\|index>` | Sheet to output (default: first) |
| `-S, --all-sheets` | Output all sheets |
| `-c, --columns <list>` | Columns: by name, letter, index, or range |
| `-r, --rows <range>` | Row range (1-based): `1-50`, `10-`, `-20`, `5` |
| `-l, --limit <n>` | Max rows to output |
| `-o, --offset <n>` | Skip first n data rows |
| `--no-header` | Omit header row |

## Supported formats

- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)
- `.ods` (OpenDocument)

## Output

RFC 4180 compliant CSV with `\r\n` line endings. Fields containing commas, quotes, or newlines are properly escaped.

## License

MIT
