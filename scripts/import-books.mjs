import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Goodreads library exports include private shelves too: publish only “read”.
export function parseBooks(csv) {
  const rows = [];
  let row = [],
    field = '',
    quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"') {
      if (quoted && csv[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (char === ',' || char === '\n')) {
      row.push(field.replace(/\r$/, ''));
      field = '';
      if (char === '\n') {
        rows.push(row);
        row = [];
      }
    } else field += char;
  }
  if (quoted) throw new Error('Unclosed quoted field in Goodreads CSV.');
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  const headers =
    rows.shift()?.map((value) => value.replace(/^\uFEFF/, '')) ?? [];
  for (const name of [
    'Book Id',
    'Title',
    'Author',
    'Exclusive Shelf',
    'My Rating',
    'Date Read',
  ])
    if (!headers.includes(name))
      throw new Error(`Missing Goodreads CSV column: ${name}`);
  const books = new Map();
  for (const values of rows) {
    if (values.every((value) => !value.trim())) continue;
    const item = Object.fromEntries(
      headers.map((key, i) => [key, values[i]?.trim() ?? '']),
    );
    if (item['Exclusive Shelf'] !== 'read') continue;
    const id = item['Book Id'];
    const rating = Number(item['My Rating']);
    const date = item['Date Read'].replaceAll('/', '-');
    if (
      !/^\d+$/.test(id) ||
      !item.Title ||
      !item.Author ||
      !Number.isInteger(rating) ||
      rating < 0 ||
      rating > 5
    )
      throw new Error(`Invalid book in Goodreads CSV: ${id || '(missing ID)'}`);
    if (
      date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date)
    )
      throw new Error(`Invalid Date Read for book ${id}`);
    books.set(id, {
      id,
      title: item.Title,
      author: item.Author,
      rating,
      dateRead: date || null,
    });
  }
  return [...books.values()].sort(
    (a, b) =>
      (b.dateRead ?? '').localeCompare(a.dateRead ?? '') ||
      a.title.localeCompare(b.title),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = new URL(
    '../src/data/goodreads_library_export.csv',
    import.meta.url,
  );
  const path = process.argv[2] ?? source;
  const books = parseBooks(await readFile(path, 'utf8'));
  if (process.argv[2] && fileURLToPath(source) !== resolve(process.argv[2]))
    await copyFile(path, source);
  const output = new URL('../src/data/books.json', import.meta.url);
  const previous = JSON.parse(await readFile(output, 'utf8'));
  if (JSON.stringify(previous.books) === JSON.stringify(books)) {
    console.log(`Bookshelf is up to date (${books.length} read books).`);
  } else {
    await writeFile(
      output,
      JSON.stringify(
        { updated: new Date().toISOString().slice(0, 10), books },
        null,
        2,
      ) + '\n',
    );
    console.log(`Imported ${books.length} read books.`);
  }
}
