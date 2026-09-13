/** Minimal RFC4180 CSV parse/serialize (quoted fields, embedded newlines). */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    // Ignore trailing empty row from final newline
    if (row.length === 1 && row[0] === '' && rows.length > 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const c = text[i]!;
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ',') {
      pushField();
      i += 1;
      continue;
    }
    if (c === '\r') {
      pushField();
      pushRow();
      i += text[i + 1] === '\n' ? 2 : 1;
      continue;
    }
    if (c === '\n') {
      pushField();
      pushRow();
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }

  if (field.length > 0 || row.length > 0 || inQuotes) {
    pushField();
    pushRow();
  }

  return rows;
}

export function serializeCsv(rows: string[][]): string {
  return rows
    .map((cols) =>
      cols
        .map((cell) => {
          const needsQuotes =
            cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r');
          if (!needsQuotes) return cell;
          return `"${cell.replace(/"/g, '""')}"`;
        })
        .join(','),
    )
    .join('\n');
}
