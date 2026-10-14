import { Router } from '@angular/router';
import { ENTITY_TYPE_IDS, getTokenFromLocalStorage, STORAGE_KEYS } from '../../../../constants';

export function readRoleId(): number | null {
  const stored = getTokenFromLocalStorage(STORAGE_KEYS.CURRENT_ROLE);
  return stored != null && stored !== '' ? Number(stored) : null;
}

export function workspaceLabel(): string {
  const role = readRoleId();
  if (role === ENTITY_TYPE_IDS.COMPANY) {
    return 'Brand Center';
  }
  if (role === ENTITY_TYPE_IDS.MEDIATOR) {
    return 'Partner Hub';
  }
  if (role === ENTITY_TYPE_IDS.ADMIN) {
    return 'Enterprise Control';
  }
  return 'Member Portal';
}

export function ensureMemberRole(router: Router): boolean {
  return ensureRoles(router, [ENTITY_TYPE_IDS.USER]);
}

export function ensureWorkspaceRole(router: Router): boolean {
  return ensureRoles(router, [ENTITY_TYPE_IDS.USER, ENTITY_TYPE_IDS.COMPANY, ENTITY_TYPE_IDS.MEDIATOR]);
}

export function ensureProfileRole(router: Router): boolean {
  return ensureRoles(router, [ENTITY_TYPE_IDS.USER, ENTITY_TYPE_IDS.MEDIATOR]);
}

function ensureRoles(router: Router, allowed: number[]): boolean {
  const role = readRoleId();
  if (role != null && allowed.includes(role)) {
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
