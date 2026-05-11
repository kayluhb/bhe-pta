import {describe, expect, it} from 'vitest';

import {buildPdfFilename, buildReceiptFilename, slugifyName} from '../reimbursement/filename';

describe('slugifyName', () => {
  it('slugifies and appends compact date', () => {
    expect(slugifyName('Caleb Brown!', '2026-02-21')).toBe('caleb-brown-20260221');
  });
});

describe('buildReceiptFilename', () => {
  it('uses extension from filename when present', () => {
    expect(buildReceiptFilename('slug', 0, 'photo.JPEG', 'image/png')).toMatch(/\.jpeg$/i);
  });

  it('falls back to content type map', () => {
    expect(buildReceiptFilename('s', 1, 'noext', 'image/png')).toBe('s-receipt-2.png');
    expect(buildReceiptFilename('s', 0, 'noext', 'application/pdf')).toBe('s-receipt-1.pdf');
    expect(buildReceiptFilename('s', 0, 'noext', 'image/webp')).toBe('s-receipt-1.webp');
    expect(buildReceiptFilename('s', 0, 'noext', 'image/heic')).toBe('s-receipt-1.heic');
    expect(buildReceiptFilename('s', 0, 'noext', 'application/octet-stream')).toBe(
      's-receipt-1.bin',
    );
  });
});

describe('buildPdfFilename', () => {
  it('returns pdf name', () => {
    expect(buildPdfFilename('my-slug')).toBe('my-slug.pdf');
  });
});
