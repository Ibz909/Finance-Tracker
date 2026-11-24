import type { IsoDate } from '../../utils/dates';

/**
 * Downloads text as a file, created entirely in the browser: nothing is
 * uploaded anywhere. A byte-order mark at the start tells Excel the file
 * is UTF-8, so "£", "&" and accented letters display correctly.
 */
export function downloadTextFile(fileName: string, text: string, type = 'text/csv'): void {
  const blob = new Blob(['﻿', text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before freeing the memory.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export function exportFileName(today: IsoDate): string {
  return `finance-tracker-transactions-${today}.csv`;
}
