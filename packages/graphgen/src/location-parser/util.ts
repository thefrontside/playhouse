import { URL } from 'url';
import path from 'path';

export function isUrl(possible: string): boolean {
  try {
    new URL(possible);
    return true;
  } catch {
    return false;
  }
}

export function pathIsAbsolute(p: string): boolean {
  return path.resolve(p) === path.normalize(p).replace(RegExp(path.sep+'$'), '');
}