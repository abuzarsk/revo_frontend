import { afterNextRender, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { getTokenFromLocalStorage, ROUTES, STORAGE_KEYS,ENTITY_TYPE_IDS } from '../../constants';
import { Apiservice } from '../../services/apiservice';

interface QuickAction {
  title: string;
  subtitle: string;
  icon: string;
  tone: 'blue' | 'purple' | 'green' | 'red';
  route?: string;
}

interface OrderStatusCard {
  key: string;
  label: string;
  count: number;
  icon: string;
  tone: 'blue' | 'purple' | 'green' | 'red' | 'gray';
  badge?: string;
}

type ActionTone = QuickAction['tone'];
type StatusTone = OrderStatusCard['tone'];

// "accepted_refunds": 1,
// "pending_refunds": 2,
// "rejected_refunds": 0

const DEFAULT_ORDER_STATUSES_FOR_COMPANIES: OrderStatusCard[] = [
  { key: 'products', label: 'Products', count: 0, icon: 'fa-file-text-o', tone: 'blue' },
  { key: 'mediators_connected', label: 'Mediators Connected', count: 0, icon: 'fa-file-text-o', tone: 'blue' },
  { key: 'users_connected', label: 'Users Connected', count: 0, icon: 'fa-reply', tone: 'purple', badge: 'POPUP' },
  { key: 'active_promoted_products', label: 'Promoted Products', count: 0, icon: 'fa-check-circle', tone: 'blue' },
  { key: 'demoted_products', label: 'Demoted Products', count: 0, icon: 'fa-times-circle', tone: 'red' },
  { key: 'mediator_promoted_products', label: 'Mediator Promoted Products', count: 0, icon: 'fa-refresh', tone: 'purple' },
  { key: 'mediator_demoted_products', label: 'Mediator Demoted Products', count: 0, icon: 'fa-money', tone: 'green' },
  { key: 'form_submissions', label: 'Form Submissions', count: 0, icon: 'fa-credit-card', tone: 'blue' },
  { key: 'refund_submissions', label: 'Refund Submissions', count: 0, icon: 'fa-minus-circle', tone: 'gray' },
  { key: 'accepted_refunds', label: 'Accepted Submissions', count: 0, icon: 'fa-minus-circle', tone: 'gray' },
  { key: 'pending_refunds', label: 'Pending Submissions', count: 0, icon: 'fa-minus-circle', tone: 'gray' },
  { key: 'rejected_refunds', label: 'Rejected Submissions', count: 0, icon: 'fa-minus-circle', tone: 'gray' },

];

const DEFAULT_ORDER_STATUSES_FOR_MEDIATORS: OrderStatusCard[] = [
  { key: 'products', label: 'Products', count: 0, icon: 'fa-file-text-o', tone: 'blue' },
  { key: 'users_connected', label: 'Users Connected', count: 0, icon: 'fa-reply', tone: 'purple', badge: 'POPUP' },
  { key: 'companies_connected', label: 'Companies Connected', count: 0, icon: 'fa-file-text-o', tone: 'blue' },
  { key: 'active_promoted_products', label: 'Promoted Products', count: 0, icon: 'fa-check-circle', tone: 'blue' },
  { key: 'demoted_products', label: 'Demoted Products', count: 0, icon: 'fa-times-circle', tone: 'red' },
  { key: 'form_submissions', label: 'Form Submissions', count: 0, icon: 'fa-credit-card', tone: 'blue' },
  { key: 'refund_submissions', label: 'Refund Submissions', count: 0, icon: 'fa-minus-circle', tone: 'gray' },
  { key: 'accepted_refunds', label: 'Accepted Submissions', count: 0, icon: 'fa-minus-circle', tone: 'gray' },
  { key: 'pending_refunds', label: 'Pending Submissions', count: 0, icon: 'fa-minus-circle', tone: 'gray' },
  { key: 'rejected_refunds', label: 'Rejected Submissions', count: 0, icon: 'fa-minus-circle', tone: 'gray' },
];

const DEFAULT_ORDER_STATUS_FOR_USERS: OrderStatusCard[] = [
  { key: 'products', label: 'Products', count: 0, icon: 'fa-file-text-o', tone: 'blue' },
  { key: 'companies_connected', label: 'Companies Connected', count: 0, icon: 'fa-file-text-o', tone: 'blue' },
  { key: 'form_submissions', label: 'Form Submissions', count: 0, icon: 'fa-credit-card', tone: 'blue' },
  { key: 'refund_submissions', label: 'Refund Submissions', count: 0, icon: 'fa-minus-circle', tone: 'gray' },
  { key: 'accepted_refunds', label: 'Accepted Submissions', count: 0, icon: 'fa-minus-circle', tone: 'gray' },
  { key: 'pending_refunds', label: 'Pending Submissions', count: 0, icon: 'fa-minus-circle', tone: 'gray' },
  { key: 'rejected_refunds', label: 'Rejected Submissions', count: 0, icon: 'fa-minus-circle', tone: 'gray' },
];

const STATUS_COUNT_ALIASES: Record<string, string[]> = {
  products: ['products', 'products_count', 'productsCount', '1'],
  order_filled: ['mediators_connected', 'order_form_filled', 'orders_filled', 'orderFilled', 'orderFormFilled', '1'],
  refund_filled: ['users_connected', 'refund_form_filled', 'refundFilled', 'refundFormFilled', '2'],
  approved: ['active_promoted_products', 'approved_count', 'approvedCount', '3'],
  rejected: ['demoted_products', 'rejected_count', 'rejectedCount', '4'],
  refill: ['mediator_promoted_products', 'refill_requested', 'refillRequested', '5'],
  paid: ['paid', 'mediator_demoted_products', 'paidCount', '6'],
  brand_paid: ['form_submissions', 'brandPaid', '7'],
  cancelled: ['refund_submissions', 'canceled', 'cancelled_count', 'cancelledCount', '8'],
  accepted_refunds: ['accepted_refunds', 'accepted_refunds_count', 'acceptedRefundsCount', '9'],
  pending_refunds: ['pending_refunds', 'pending_refunds_count', 'pendingRefundsCount', '10'],
  rejected_refunds: ['rejected_refunds', 'rejected_refunds_count', 'rejectedRefundsCount', '11'],
};

const COUNT_FIELD_NAMES = [
  'count',
  'total',
  'value',
  'qty',
  'quantity',
  'number',
  'num',
  'amount',
  'data',
  'counts',
  'status_count',
  'statusCount',
  'submission_count',
  'submissionCount',
  'submissions',
  'total_count',
  'totalCount',
  'record_count',
  'records',
  'cnt',
  'no',
  'box_count',
  'boxCount',
];

@Component({
  selector: 'app-dashboard-welcome',
  imports: [RouterLink],
  templateUrl: './dashboard-welcome.html',
  styleUrl: './dashboard-welcome.css',
})
export class DashboardWelcome implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  userName = 'there';
  todayLabel = '';
  portalBadge = 'MEMBER PORTAL';
  welcomeMessage = 'Welcome back to your dashboard.';
  ordersCount = 0;
  earnedAmount = 0;
  selectedStatusKey: string | null = null;
  isLoading = true;
  token: any = null;
  dashboardData: any = null;
  totalProducts = 0;
  tokenObj: any;
  role: any;

  quickActions: QuickAction[] = [];
  orderStatuses: OrderStatusCard[] = [];

  private initialized = false;

  constructor(
    private apiService: Apiservice,
    private cdr: ChangeDetectorRef,
  ) {
    afterNextRender(() => {
      this.initFromBrowser();
    });
  }

  ngOnInit(): void {

    this.tokenObj = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ);
    this.role = this.tokenObj?.user?.default_role ?? null;


    this.todayLabel = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());


    if (this.role === ENTITY_TYPE_IDS.COMPANY) {
      this.portalBadge = 'Brand Center overview';
      this.orderStatuses = DEFAULT_ORDER_STATUSES_FOR_COMPANIES;
    } else if (this.role === ENTITY_TYPE_IDS.ADMIN) {
      this.portalBadge = 'Enterprise overview';
    } else if (this.role === ENTITY_TYPE_IDS.USER) {
      this.portalBadge = 'Member Portal overview';
      this.orderStatuses = DEFAULT_ORDER_STATUS_FOR_USERS;
    } else if (this.role === ENTITY_TYPE_IDS.MEDIATOR) {
      this.portalBadge = 'Partner Hub overview';
      this.orderStatuses = DEFAULT_ORDER_STATUSES_FOR_MEDIATORS;
    }
    if (isPlatformBrowser(this.platformId)) {
      this.initFromBrowser();
    }
    this.getDashboard();
  }

  ngOnDestroy(): void {}

  private initFromBrowser(): void {
    if (this.initialized || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.initialized = true;

    const data: any = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ);
    this.token = data?.token ?? null;

    const name = data?.user?.name?.trim() || data?.user?.email?.split('@')[0] || 'there';
    this.userName = name;

   // 
  }

  getDashboard(): void {
    if (!this.token) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.apiService.getDashboardData(this.token).subscribe({
      next: (res: any) => {
        console.log('Dashboard API response:', res);
        this.dashboardData = this.unwrapDashboardResponse(res);
        this.totalProducts = this.dashboardData.products;
        this.applyDashboardData(this.dashboardData);
        console.log('Mapped dashboard:', {
          ordersCount: this.ordersCount,
          earnedAmount: this.earnedAmount,
          quickActions: this.quickActions,
          orderStatuses: this.orderStatuses,
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Dashboard data error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  protected toggleStatusFilter(key: string): void {
    this.selectedStatusKey = this.selectedStatusKey === key ? null : key;
  }

  protected get heroStats(): OrderStatusCard[] {
    return this.orderStatuses.slice(0, 2);
  }

  protected get pageWelcome(): string {
    if (this.welcomeMessage && this.welcomeMessage !== 'Welcome back to your dashboard.') {
      return this.welcomeMessage;
    }
    if (this.role === ENTITY_TYPE_IDS.COMPANY) {
      return 'Welcome to your brand center.';
    }
    if (this.role === ENTITY_TYPE_IDS.MEDIATOR) {
      return 'Welcome to your partner hub.';
    }
    if (this.role === ENTITY_TYPE_IDS.ADMIN) {
      return 'Welcome to enterprise control.';
    }
    return 'Welcome to your member portal.';
  }

  protected get heroTitle(): string {
    if (this.role === ENTITY_TYPE_IDS.MEDIATOR) {
      return 'Your partner activity, at a glance';
    }
    if (this.role === ENTITY_TYPE_IDS.USER) {
      return 'Your activity, at a glance';
    }
    if (this.role === ENTITY_TYPE_IDS.ADMIN) {
      return 'Your network, at a glance';
    }
    return 'Your product performance, at a glance';
  }

  private unwrapDashboardResponse(res: any): any {
    if (!res) {
      return null;
    }

    let payload = res;
    for (let depth = 0; depth < 3; depth++) {
      if (payload?.data != null && typeof payload.data === 'object') {
        payload = payload.data;
        continue;
      }
      if (payload?.result != null && typeof payload.result === 'object') {
        payload = payload.result;
        continue;
      }
      if (payload?.dashboard != null && typeof payload.dashboard === 'object') {
        payload = payload.dashboard;
        continue;
      }
      break;
    }

    if (Array.isArray(payload) && payload.length > 0) {
      return { statuses: payload };
    }

    return payload;
  }

  private applyDashboardData(data: any): void {
    if (!data || typeof data !== 'object') {
      return;
    }

    const name = data.user?.name?.trim() || data.user?.email?.split('@')[0] || data.name;
    if (name) {
      this.userName = name;
    }

    this.portalBadge =
      data.portal_badge ??
      data.portalBadge ??
      data.portal ??
      data.badge ??
      this.portalBadge;

    this.welcomeMessage =
      data.welcome_message ??
      data.welcomeMessage ??
      data.message ??
      data.subtitle ??
      this.welcomeMessage;

    this.applyHeroStats(data);
    this.applyBoxes(data);
    this.applyQuickActions(data);
    this.applyOrderStatuses(data);
  }

  private applyBoxes(data: any): void {
    const boxes = data.boxes ?? data.tiles ?? data.cards;
    if (!Array.isArray(boxes) || !boxes.length) {
      return;
    }

    const statusBoxes: any[] = [];
    const quickBoxes: any[] = [];

    for (const box of boxes) {
      const type = String(box.type ?? box.box_type ?? box.category ?? '').toLowerCase();
      const label = String(box.label ?? box.title ?? box.name ?? box.status_name ?? '').toLowerCase();

      if (
        type.includes('status') ||
        box.status_key ||
        box.status_id != null ||
        (box.status != null && typeof box.status !== 'string') ||
        label.includes('order form') ||
        label.includes('refund form') ||
        label.includes('approved') ||
        label.includes('rejected') ||
        label.includes('refill') ||
        label.includes('brand paid') ||
        label.includes('cancelled') ||
        label.includes('canceled') ||
        (label.includes('paid') && !label.includes('payment'))
      ) {
        statusBoxes.push(box);
        continue;
      }

      if (type.includes('quick') || type.includes('action') || box.route || box.path || box.link || box.url) {
        quickBoxes.push(box);
        continue;
      }

      if (this.extractCount(box) > 0 && label) {
        statusBoxes.push(box);
        continue;
      }

      quickBoxes.push(box);
    }

    if (statusBoxes.length) {
      data._statusBoxes = statusBoxes;
    }
    if (quickBoxes.length) {
      data._quickBoxes = quickBoxes;
    }
  }

  private applyHeroStats(data: any): void {
    const stats = data.stats ?? data.summary ?? data.counts ?? data;

    this.ordersCount = this.readNumber(
      stats.orders,
      stats.orders_count,
      stats.ordersCount,
      stats.order_count,
      stats.orderCount,
      stats.order_filled,
      stats.order_form_filled,
      data.orders,
      data.orders_count,
      data.order_count,
    );

    this.earnedAmount = this.readNumber(
      stats.earned,
      stats.earned_amount,
      stats.earnedAmount,
      stats.total_earned,
      stats.totalEarned,
      stats.income,
      stats.total_income,
      stats.earnings,
      stats.earning,
      stats.wallet,
      stats.balance,
      stats.total_paid,
      data.earned,
      data.earned_amount,
      data.total_earned,
      data.income,
    );
  }

  private applyQuickActions(data: any): void {
    const quickActions =
      data._quickBoxes ??
      data.quick_actions ??
      data.quickActions ??
      data.actions ??
      data.shortcuts;

    if (Array.isArray(quickActions) && quickActions.length > 0) {
      this.quickActions = quickActions.map((action: any) => {
        const count = this.extractCount(action);
        const baseTitle = String(action.title ?? action.label ?? action.name ?? action.heading ?? '');
        const title = count > 0 && !/^\d+/.test(baseTitle) ? `${count} ${baseTitle}` : baseTitle;

        return {
          title,
          subtitle: String(action.subtitle ?? action.description ?? action.sub_title ?? action.subheading ?? ''),
          icon: action.icon ?? 'fa-circle-o',
          tone: this.toActionTone(action.tone ?? action.color),
          route: action.route ?? action.path ?? action.link ?? action.url,
        };
      });
      return;
    }

    const deals = this.readNumber(data.deals, data.deal_count, data.deals_count);
    const coins = this.readNumber(data.coins, data.coin_count, data.coins_count);

    if (deals > 0 || coins > 0 || data.new_order != null) {
      this.quickActions = [
        {
          title: 'New order',
          subtitle: 'Submit order form',
          icon: 'fa-plus',
          tone: 'blue',
          route: `/${ROUTES.PRODUCTS}`,
        },
        {
          title: `${deals} deals`,
          subtitle: 'Active deals',
          icon: 'fa-ticket',
          tone: 'purple',
          route: `/${ROUTES.PRODUCTS}`,
        },
        {
          title: `${coins} coins`,
          subtitle: 'Rewards',
          icon: 'fa-circle-o',
          tone: 'green',
        },
        {
          title: 'Support',
          subtitle: 'My queries',
          icon: 'fa-life-ring',
          tone: 'red',
        },
      ];
    }
  }

  private applyOrderStatuses(data: any): void {
    const statuses =
      data._statusBoxes ??
      data.order_statuses ??
      data.orderStatuses ??
      data.order_status ??
      data.statuses ??
      data.status_boxes ??
      data.statusBoxes ??
      data.status_box ??
      data.submission_statuses ??
      data.submissionStatuses;

    if (Array.isArray(statuses) && statuses.length > 0) {
      this.orderStatuses = statuses.map((status: any, index: number) => ({
        key: this.resolveStatusKey(status, index),
        label: status.label ?? status.name ?? status.title ?? status.status_name ?? status.status_label ?? '',
        count: this.extractCount(status),
        icon: status.icon ?? 'fa-circle-o',
        tone: this.toStatusTone(status.tone ?? status.color),
        badge: status.badge,
      }));
      this.syncHeroStatsFromStatuses();
      return;
    }

    if (statuses && typeof statuses === 'object') {
      if (this.role === ENTITY_TYPE_IDS.COMPANY) {
      this.orderStatuses = DEFAULT_ORDER_STATUSES_FOR_COMPANIES.map((status) => ({
          ...status,
          count: this.readStatusCount(statuses, status.key),
        }));
      } else if (this.role === ENTITY_TYPE_IDS.USER) {
        this.orderStatuses = DEFAULT_ORDER_STATUS_FOR_USERS.map((status) => ({
          ...status,
          count: this.readStatusCount(statuses, status.key),
        }));
      } else if (this.role === ENTITY_TYPE_IDS.MEDIATOR) {
        this.orderStatuses = DEFAULT_ORDER_STATUSES_FOR_MEDIATORS.map((status) => ({
          ...status,
          count: this.readStatusCount(statuses, status.key),
        }));
      }
      this.syncHeroStatsFromStatuses();
      return;
    }

    const statusCounts = data.status_counts ?? data.statusCounts ?? data.counts ?? data;
    if (this.role === ENTITY_TYPE_IDS.COMPANY) {
      this.orderStatuses = DEFAULT_ORDER_STATUSES_FOR_COMPANIES.map((status) => ({
        ...status,
        count: this.readStatusCount(statusCounts, status.key),
      }));
    } else if (this.role === ENTITY_TYPE_IDS.USER) {
      this.orderStatuses = DEFAULT_ORDER_STATUS_FOR_USERS.map((status) => ({
        ...status,
        count: this.readStatusCount(statusCounts, status.key),
      }));
    } else if (this.role === ENTITY_TYPE_IDS.MEDIATOR) {
      this.orderStatuses = DEFAULT_ORDER_STATUSES_FOR_MEDIATORS.map((status) => ({
        ...status,
        count: this.readStatusCount(statusCounts, status.key),
      }));
    }
    this.syncHeroStatsFromStatuses();
  }

  private syncHeroStatsFromStatuses(): void {
    if (this.ordersCount === 0) {
      const orderStatus = this.orderStatuses.find((status) => status.key === 'order_filled');
      if (orderStatus) {
        this.ordersCount = orderStatus.count;
      }
    }
  }

  private resolveStatusKey(status: any, index: number): string {
    const rawKey =
      status.key ??
      status.status_key ??
      status.slug ??
      status.status ??
      status.status_id ??
      status.id ??
      index;

    const key = String(rawKey).toLowerCase();
    if (STATUS_COUNT_ALIASES[key]) {
      return key;
    }

    const label = String(status.label ?? status.name ?? status.title ?? status.status_name ?? '').toLowerCase();
    if (label.includes('order') && label.includes('fill')) return 'order_filled';
    if (label.includes('refund') && label.includes('fill')) return 'refund_filled';
    if (label.includes('approved')) return 'approved';
    if (label.includes('rejected')) return 'rejected';
    if (label.includes('refill')) return 'refill';
    if (label.includes('brand') && label.includes('paid')) return 'brand_paid';
    if (label.includes('paid')) return 'paid';
    if (label.includes('cancel')) return 'cancelled';

    return key;
  }

  private extractCount(item: any): number {
    if (item == null) {
      return 0;
    }

    if (typeof item === 'number' || typeof item === 'string') {
      return this.readNumber(item);
    }

    const direct = this.readNumber(...COUNT_FIELD_NAMES.map((field) => item[field]));
    if (item.count === 0 || item.total === 0 || item.value === 0 || item.data === 0) {
      return 0;
    }
    if (direct > 0) {
      return direct;
    }

    for (const [field, value] of Object.entries(item)) {
      if (/id$|_id$|key$|slug$|icon$|tone$|color$|route$|path$|label$|name$|title$|badge$/i.test(field)) {
        continue;
      }
      const parsed = this.readNumber(value);
      if (parsed > 0) {
        return parsed;
      }
    }

    const title = item.title ?? item.label ?? item.name ?? item.status_name;
    if (typeof title === 'string') {
      const match = title.match(/^(\d+(?:\.\d+)?)/);
      if (match) {
        return Number(match[1]) || 0;
      }
    }

    return 0;
  }

  private readStatusCount(source: any, key: string): number {
    if (!source || typeof source !== 'object') {
      return 0;
    }

    const aliases = STATUS_COUNT_ALIASES[key] ?? [key];
    for (const alias of aliases) {
      const value = source[alias];
      if (value != null && value !== '') {
        return this.extractCount(value);
      }
    }

    return 0;
  }

  private readNumber(...values: unknown[]): number {
    for (const value of values) {
      if (value != null && value !== '') {
        if (typeof value === 'object') {
          const nested = this.extractCount(value);
          if (nested > 0 || (value as any).count === 0 || (value as any).total === 0) {
            return nested;
          }
          continue;
        }
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }
    return 0;
  }

  private toActionTone(value: unknown): ActionTone {
    if (value === 'purple' || value === 'green' || value === 'red') {
      return value;
    }
    return 'blue';
  }

  private toStatusTone(value: unknown): StatusTone {
    if (value === 'purple' || value === 'green' || value === 'red' || value === 'gray') {
      return value;
    }
    return 'blue';
  }
}
