import * as XLSX from 'xlsx';
import { writeFileSync } from 'node:fs';

function makeWorkbook(sheets: Array<{ name: string; data: unknown[][] }>) {
  const wb = XLSX.utils.book_new();
  for (const { name, data } of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), name);
  }
  return wb;
}

// simple.xlsx
writeFileSync(
  'test/fixtures/simple.xlsx',
  XLSX.write(
    makeWorkbook([{
      name: 'Sheet1',
      data: [
        ['Name', 'Revenue', 'Region'],
        ['Acme', 1500000, 'North'],
        ['Globex', 980000, 'South'],
        ['Initech', 450000, 'East'],
        ['Umbrella', 2100000, 'West'],
        ['Hooli', 750000, 'North'],
      ],
    }]),
    { type: 'buffer', bookType: 'xlsx' },
  ),
);

// multi-sheet.xlsx
writeFileSync(
  'test/fixtures/multi-sheet.xlsx',
  XLSX.write(
    makeWorkbook([
      { name: 'Products', data: [['Product', 'Sales'], ['Widget', 100], ['Gadget', 200]] },
      { name: 'Countries', data: [['Country', 'Code'], ['USA', 'US'], ['UK', 'GB']] },
      { name: 'Summary', data: [['Total'], [300]] },
    ]),
    { type: 'buffer', bookType: 'xlsx' },
  ),
);

// legacy.xls
writeFileSync(
  'test/fixtures/legacy.xls',
  XLSX.write(
    makeWorkbook([{
      name: 'Sheet1',
      data: [
        ['Name', 'Revenue', 'Region'],
        ['Acme', 1500000, 'North'],
        ['Globex', 980000, 'South'],
      ],
    }]),
    { type: 'buffer', bookType: 'xls' },
  ),
);

// openoffice.ods
writeFileSync(
  'test/fixtures/openoffice.ods',
  XLSX.write(
    makeWorkbook([{
      name: 'Sheet1',
      data: [
        ['Name', 'Revenue', 'Region'],
        ['Alpha', 100, 'North'],
        ['Beta', 200, 'South'],
      ],
    }]),
    { type: 'buffer', bookType: 'ods' },
  ),
);

console.log('Fixtures created successfully');
