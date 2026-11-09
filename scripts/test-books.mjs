import assert from 'node:assert/strict';
import { parseBooks } from './import-books.mjs';

const header =
  'Book Id,Title,Author,Exclusive Shelf,My Rating,Date Read,My Review\r\n';
const books = parseBooks(
  '\uFEFF' +
    header +
    '1,"A book, with ""quotes""",An Author,read,5,2026/02/03,"Private\nreview"\r\n' +
    '2,Unread,Someone,to-read,0,,Private\r\n' +
    '3,Undated,Another Author,read,0,,\r\n' +
    '4,Recent,Author,read,4,2026/10/01,\r\n',
);
assert.deepEqual(
  books.map((book) => book.id),
  ['4', '1', '3'],
);
assert.equal(books[1].title, 'A book, with "quotes"');
assert.equal(books[1].dateRead, '2026-02-03');
assert.equal(books[2].dateRead, null);
assert.equal(books[2].rating, 0);
assert.ok(!JSON.stringify(books).includes('Private'));
assert.throws(() => parseBooks('Title\nBook'), /Missing Goodreads/);
assert.throws(
  () => parseBooks(header + '1,Book,Author,read,9,,\n'),
  /Invalid book/,
);
assert.throws(
  () => parseBooks(header + '1,Book,Author,read,3,2026/02/30,\n'),
  /Invalid Date/,
);
assert.throws(() => parseBooks(header + '1,"Unfinished'), /Unclosed/);
assert.deepEqual(parseBooks(header), []);
console.log('Goodreads import checks passed.');
