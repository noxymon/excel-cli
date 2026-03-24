import { describe, it, expect } from 'vitest';
import { resolveColumns } from '../../src/utils/columns.js';

const headers = ['Name', 'Revenue', 'Region'];

describe('resolveColumns', () => {
  it('resolves by header name (case-insensitive)', () => {
    expect(resolveColumns('name,revenue', headers)).toEqual([0, 1]);
    expect(resolveColumns('NAME,REGION', headers)).toEqual([0, 2]);
  });

  it('resolves by Excel letter', () => {
    expect(resolveColumns('A', headers)).toEqual([0]);
    expect(resolveColumns('B,C', headers)).toEqual([1, 2]);
  });

  it('resolves by 1-based index', () => {
    expect(resolveColumns('1', headers)).toEqual([0]);
    expect(resolveColumns('2,3', headers)).toEqual([1, 2]);
  });

  it('resolves letter range A-C', () => {
    expect(resolveColumns('A-C', headers)).toEqual([0, 1, 2]);
  });

  it('resolves number range 1-2', () => {
    expect(resolveColumns('1-2', headers)).toEqual([0, 1]);
  });

  it('header name takes priority over Excel letter', () => {
    // "Name" starts with a letter but should match the header, not column N
    expect(resolveColumns('Name', headers)).toEqual([0]);
  });

  it('returns sorted indices', () => {
    expect(resolveColumns('C,A', headers)).toEqual([0, 2]);
  });

  it('deduplicates indices', () => {
    expect(resolveColumns('A,1', headers)).toEqual([0]);
  });

  it('silently skips out-of-range indices', () => {
    expect(resolveColumns('Z', headers)).toEqual([]);
    expect(resolveColumns('99', headers)).toEqual([]);
  });

  it('throws on unknown column name', () => {
    expect(() => resolveColumns('NoSuchColumn', headers)).toThrow();
  });
});
