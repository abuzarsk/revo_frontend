import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Apiservice } from '../../../../services/apiservice';
import { getTokenFromLocalStorage, STORAGE_KEYS, USER_ROLES } from '../../../../constants';

@Component({
  selector: 'app-users',
  imports: [CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {

  token: any;
  usersList: any[] = [];
  loading = false;

  constructor(private apiService: Apiservice, private cdr: ChangeDetectorRef) {
    const tokenObj = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ);
    this.token = tokenObj?.token ?? null;
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    if (!this.token) return;
    this.loading = true;
    this.apiService.getUsers(this.token, 1).subscribe({
      next: (res: any) => {
        this.usersList = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  /** Map role ID to USER_ROLES label (1=Admin, 2=Company, 3=Mediator, 4=User) */
  private readonly roleIdToLabel: Record<number, string> = {
    1: USER_ROLES.ADMIN,
    2: USER_ROLES.COMPANY,
    3: USER_ROLES.MEDIATOR,
    4: USER_ROLES.USER,
  };

  /** Display roles array as comma-separated labels from USER_ROLES */
  formatRoles(roles: number[] | null | undefined): string {
    if (!roles || !Array.isArray(roles)) return '—';
    const labels = roles.map((id) => this.roleIdToLabel[id] ?? id);
    return labels.length ? labels.join(', ') : '—';
  }

  /** Single role ID to USER_ROLES label (for default role column) */
  formatRoleId(roleId: number | null | undefined): string {
    if (roleId == null) return '—';
    return this.roleIdToLabel[roleId] ?? String(roleId);
  }
}
