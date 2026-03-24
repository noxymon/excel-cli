export type CellType = 'string' | 'number' | 'integer' | 'date' | 'boolean' | 'empty';

export interface Cell {
  value: string | number | boolean | Date | null;
  rawValue: string;
  type: CellType;
}

export interface Row {
  index: number; // 1-based, excludes header
  cells: Cell[];
}

export interface ColumnInfo {
  index: number; // 0-based
  letter: string; // e.g. "A", "B", "AA"
  name: string; // header value
  type: CellType;
  nullCount: number;
}

export interface Sheet {
  name: string;
  index: number;
  hidden: boolean;
  headers: string[];
  rows: Row[];
}

export interface Workbook {
  filename: string;
  format: string;
  sheets: Sheet[];
}
