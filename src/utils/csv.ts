/**
 * RFC 4180-compliant CSV serialization.
 * Fields containing commas, double-quotes, or newlines are double-quoted.
 * Embedded double-quotes are escaped as "".
 */
export function escapeField(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function rowToCsv(fields: string[]): string {
  return fields.map(escapeField).join(',');
}
