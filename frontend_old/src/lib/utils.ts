import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value?: number) {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

export function getFileName(path: string) {
  return path.split('/').filter(Boolean).pop() ?? path;
}

export function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function isExternalModule(moduleName: string) {
  return !moduleName.startsWith('.') && !moduleName.includes('/');
}
