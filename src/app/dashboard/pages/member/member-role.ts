import { Router } from '@angular/router';
import { ENTITY_TYPE_IDS, getTokenFromLocalStorage, STORAGE_KEYS } from '../../../../constants';

export function ensureMemberRole(router: Router): boolean {
  const stored = getTokenFromLocalStorage(STORAGE_KEYS.CURRENT_ROLE);
  const role = stored != null && stored !== '' ? Number(stored) : null;
  if (role === ENTITY_TYPE_IDS.USER) {
    return true;
  }
  router.navigateByUrl('/');
  return false;
}

export function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

export function writeStoredJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}
