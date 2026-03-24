import { describe, it, expect } from 'vitest';
import { escapeField, rowToCsv } from '../../src/utils/csv.js';

describe('escapeField', () => {
  it('passes through plain strings', () => {
    expect(escapeField('hello')).toBe('hello');
    expect(escapeField('123')).toBe('123');
  });

  it('wraps fields containing commas', () => {
    expect(escapeField('a,b')).toBe('"a,b"');
  });

  it('wraps fields containing double-quotes and escapes them', () => {
    expect(escapeField('say "hi"')).toBe('"say ""hi"""');
  });

  it('wraps fields containing newlines', () => {
    expect(escapeField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('wraps fields containing carriage returns', () => {
    expect(escapeField('a\rb')).toBe('"a\rb"');
  });
});

describe('rowToCsv', () => {
  it('joins plain fields with commas', () => {
    expect(rowToCsv(['a', 'b', 'c'])).toBe('a,b,c');
  });

  it('escapes fields that need it', () => {
    expect(rowToCsv(['hello', 'world,earth', 'ok'])).toBe('hello,"world,earth",ok');
  });
});
