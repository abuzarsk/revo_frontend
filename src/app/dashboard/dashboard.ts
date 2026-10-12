import { ChangeDetectorRef, Component, HostListener, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import {
  getTokenFromLocalStorage,
  ROUTES,
  STORAGE_KEYS,
  USER_ROLES,
  ADMIN_SIDEBAR_MENU,
  COMPANY_SIDEBAR_MENU,
  MEDIATOR_SIDEBAR_MENU,
  USER_SIDEBAR_MENU,
} from '../../constants';
import { Apiservice } from '../../services/apiservice';

interface SidebarMenuItem {
  key: string;
  label: string;
  route: string;
  icon: string;
}

const SIDEBAR_COLLAPSED_KEY = 'dashboard_sidebar_collapsed';
const MOBILE_BREAKPOINT = 900;

const SIDEBAR_MENU_LOOKUP = [
  ...ADMIN_SIDEBAR_MENU,
  ...COMPANY_SIDEBAR_MENU,
  ...MEDIATOR_SIDEBAR_MENU,
  ...USER_SIDEBAR_MENU,
].reduce<Record<string, SidebarMenuItem>>((lookup, item) => {
  lookup[item.key] = item;
  return lookup;
}, {});

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  role: number | null = null;
  roles: number[] = [];
  userName = 'User';
  userInitials = 'U';
  sidebarCollapsed = false;
  mobileSidebarOpen = false;
  workspaceMenuOpen = false;
  dashboardData: any = null;
  sidebarMenu: SidebarMenuItem[] = [];

  token: any = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.token || null;

  private routerSub?: Subscription;

  constructor(
    private router: Router,
    private apiService: Apiservice,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.sidebarMenu = this.getRoleFallbackMenu();
      return;
    }

    const data: any = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ);
    const currentRole = getTokenFromLocalStorage(STORAGE_KEYS.CURRENT_ROLE);
    this.token = data?.token ?? null;

    this.role = Number(currentRole ?? data?.user?.default_role ?? null) || null;
    this.roles = data?.user?.roles ?? [];

    const name = data?.user?.name?.trim() || data?.user?.email?.split('@')[0] || 'User';
    this.userName = name;
    this.userInitials = this.buildInitials(name);

    this.sidebarCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    this.sidebarMenu = this.getRoleFallbackMenu();

    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.closeMobileSidebar());


  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }


/*

  private applyDashboardData(data: any): void {
    if (!data) {
      this.sidebarMenu = this.getRoleFallbackMenu();
      return;
    }

    if (data.role != null) {
      this.role = Number(data.role) || this.role;
    }

    const name = data.user?.name?.trim() || data.user?.email?.split('@')[0];
    if (name) {
      this.userName = name;
      this.userInitials = this.buildInitials(name);
    }

    this.sidebarMenu = this.buildSidebarMenu(data);
  }

  private buildSidebarMenu(data: any): SidebarMenuItem[] {
    const apiMenu = data.menu ?? data.sidebar ?? data.navigation;
    if (Array.isArray(apiMenu) && apiMenu.length > 0) {
      return apiMenu
        .map((item: any) => this.normalizeMenuItem(item))
        .filter((item: SidebarMenuItem | null): item is SidebarMenuItem => item != null);
    }

    const modules = data.modules;
    if (Array.isArray(modules) && modules.length > 0) {
      const menuItems = modules
        .map((module: any) => {
          const key =
            module.module_uri ??
            module.key ??
            module.menuKey ??
            module.module_key ??
            module.moduleKey;
          return key ? SIDEBAR_MENU_LOOKUP[key] ?? this.normalizeMenuItem(module) : null;
        })
        .filter((item: SidebarMenuItem | null): item is SidebarMenuItem => item != null);

      if (menuItems.length > 0) {
        return menuItems;
      }
    }

    return this.getRoleFallbackMenu();
  }*/
/*
  private normalizeMenuItem(item: any): SidebarMenuItem | null {
    const key =
      item?.key ??
      item?.module_uri ??
      item?.menuKey ??
      item?.module_key ??
      item?.moduleKey ??
      item?.slug;

    if (!key) {
      return null;
    }

    const knownItem = SIDEBAR_MENU_LOOKUP[key];
    if (knownItem) {
      return knownItem;
    }

    return {
      key,
      label: item.label ?? item.name ?? item.title ?? String(key),
      route: item.route ?? item.path ?? item.uri ?? ROUTES.DASHBOARD,
      icon: item.icon ?? 'dashboard',
    };
  }*/

  private getRoleFallbackMenu(): SidebarMenuItem[] {
    if (this.role === 1) {
      return [...ADMIN_SIDEBAR_MENU];
    }
    if (this.role === 2) {
      return [...COMPANY_SIDEBAR_MENU];
    }
    if (this.role === 3) {
      return [...MEDIATOR_SIDEBAR_MENU];
    }
    return [...USER_SIDEBAR_MENU];
  }
  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.isMobileViewport && this.mobileSidebarOpen) {
      this.mobileSidebarOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMobileSidebar();
    this.workspaceMenuOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.workspaceMenuOpen = false;
  }

  protected get sidebarSubtitle(): string {
    if (this.role === 1) {
      return 'Enterprise Control';
    }
    if (this.role === 2) {
      return 'Brand Center';
    }
    if (this.role === 3) {
      return 'Partner Hub';
    }
    return 'Member Portal';
  }

  protected get isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
  }

  protected get sidebarToggleLabel(): string {
    if (this.isMobileViewport) {
      return this.mobileSidebarOpen ? 'Close menu' : 'Open menu';
    }
    return this.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
  }

  protected toggleSidebar(): void {
    if (this.isMobileViewport) {
      this.mobileSidebarOpen = !this.mobileSidebarOpen;
      return;
    }
    this.toggleSidebarCollapse();
  }

  protected toggleSidebarCollapse(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(this.sidebarCollapsed));
    }
  }

  protected closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  protected get workspaceOptions(): number[] {
    if (this.roles.length) {
      return this.roles;
    }
    return this.role ? [this.role] : [];
  }

  protected workspaceName(roleId: number): string {
    if (roleId === 1) {
      return 'Enterprise Control';
    }
    if (roleId === 2) {
      return 'Brand Center';
    }
    if (roleId === 3) {
      return 'Partner Hub';
    }
    return 'Member Portal';
  }

  protected workspaceInitials(label: string): string {
    const parts = label.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return label.slice(0, 2).toUpperCase();
  }

  protected toggleWorkspaceMenu(event: Event): void {
    event.stopPropagation();
    this.workspaceMenuOpen = !this.workspaceMenuOpen;
  }

  protected selectWorkspace(roleId: number, event: Event): void {
    event.stopPropagation();
    this.workspaceMenuOpen = false;
    if (!roleId || roleId === this.role) {
      return;
    }
    this.applyRoleChange(roleId);
  }

  protected getRoleLabel(roleId: number): string {
    if (roleId === 1) {
      return USER_ROLES.ADMIN;
    }
    if (roleId === 2) {
      return USER_ROLES.COMPANY;
    }
    if (roleId === 3) {
      return USER_ROLES.MEDIATOR;
    }
    return USER_ROLES.USER;
  }

  protected getSidebarIcon(icon: string): string {
    const map: Record<string, string> = {
      dashboard: 'fa-th-large',
      business: 'fa-building-o',
      brands: 'fa-shopping-bag',
      product: 'fa-cube',
      supervised_user_circle: 'fa-handshake-o',
      group: 'fa-users',
      companies: 'fa-building',
      bank: 'fa-university',
      orders: 'fa-shopping-bag',
    };
    return map[icon] ?? 'fa-circle';
  }

  private buildInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN_OBJ);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE);
    }
    this.router.navigate(['/login']);
  }

  changeRole(event: Event): void {
    const selectedRole = Number((event.target as HTMLSelectElement)?.value);
    this.applyRoleChange(selectedRole);
  }

  private applyRoleChange(selectedRole: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const rawTokenObj = localStorage.getItem(STORAGE_KEYS.TOKEN_OBJ);
    const tokenObj = rawTokenObj ? JSON.parse(rawTokenObj) : null;

    if (!tokenObj?.user) {
      return;
    }

    const data = { role: selectedRole };
    this.apiService.changeUserDefaultRole(tokenObj.token, data).subscribe({
      next: (res: any) => {
        localStorage.setItem(STORAGE_KEYS.TOKEN_OBJ, JSON.stringify(res.data));
        localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, String(selectedRole));
        this.role = selectedRole;
        window.location.href = '/dashboard';
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }
}
