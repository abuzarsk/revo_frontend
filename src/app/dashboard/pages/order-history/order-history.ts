import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import {
  ENTITY_TYPE_IDS,
  getTokenFromLocalStorage,
  IMAGE_FOLDERS,
  STORAGE_KEYS,
} from '../../../../constants';
import {
  buildPageNumbers,
  getPaginationRedirectPage,
  PaginatedListView,
  parsePaginatedResponse,
  showingFrom,
  showingTo,
} from '../products/products-pagination.model';
import { Apiservice } from '../../../../services/apiservice';

interface StatusSummary {
  key: string;
  label: string;
  count: number;
}

interface SubmissionField {
  key: string;
  label: string;
  value: string;
  imageUrl: string | null;
}

interface SubmissionFieldColumn {
  key: string;
  label: string;
  source: 'submission' | 'refund_submission_text';
}

interface OrderHistoryRow {
  raw: Record<string, unknown>;
  id: string | number;
  productName: string;
  productLabel: string;
  productImageUrl: string | null;
  productCode: string;
  brandName: string;
  companyName: string;
  platform: string;
  orderType: string;
  submittedAt: string;
  submittedShort: string;
  productLink: string;
  submission: Record<string, unknown>;
  refundSubmission: Record<string, unknown>;
  statusLabel: string;
  statusKey: string;
  refundRemark: string;
  refundPaymentImage: string | null;
  refundSubmissionCount: number;
  refundAcceptStatus: number | null;
  promoteId?: string | number;
}

const REFUND_META_FIELD_LABELS: Record<string, string> = {
  accept_reject_remark: 'Accept/Reject Remark',
  accept_reject_screenshot: 'Accept/Reject Screenshot',
  refund_accept_reject_remark: 'Accept/Reject Remark',
  refund_accept_reject_screenshot: 'Accept/Reject Screenshot',
};

const DEFAULT_STATUS_SUMMARY: StatusSummary[] = [
  { key: 'order_form_filled', label: 'Order form filled', count: 0 },
  { key: 'refund_form_filled', label: 'Refund form filled', count: 0 },
  { key: 'approved', label: 'Approved', count: 0 },
  { key: 'rejected', label: 'Rejected', count: 0 },
  { key: 'refill_requested', label: 'Refill requested', count: 0 },
  { key: 'paid', label: 'Paid', count: 0 },
  { key: 'brand_paid', label: 'Brand paid', count: 0 },
  { key: 'cancelled', label: 'Cancelled', count: 0 },
];

@Component({
  selector: 'app-order-history',
  imports: [CommonModule, FormsModule],
  templateUrl: './order-history.html',
  styleUrl: './order-history.css',
})
export class OrderHistory implements OnInit {
  private readonly imageBaseUrl = environment.imageBaseUrl;

  token: string | null = null;
  userName = 'there';
  userInitials = 'U';
  paidAmount = 0;

  statusSummary: StatusSummary[] = [...DEFAULT_STATUS_SUMMARY];
  selectedStatusKey: string | null = null;

  orders: OrderHistoryRow[] = [];
  formFieldColumns: SubmissionFieldColumn[] = [];
  refundFieldColumns: SubmissionFieldColumn[] = [];
  loading = false;
  loadError = '';

  expandedOrderId: string | number | null = null;
  searchQuery = '';
  platformFilter = 'all';
  statusFilter = 'all';
  activePill = 'all';
  dateFrom = '';
  dateTo = '';
  sortOrder = 'newest';

  currentPage = 1;
  lastPage = 1;
  totalOrders = 0;
  perPage = 10;

  platforms: string[] = ['all'];

  statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'order_form_filled', label: 'Order form filled' },
    { value: 'refund_form_filled', label: 'Refund form filled' },
    { value: 'refill_requested', label: 'Refill requested' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'paid', label: 'Paid' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  statusPills = [
    { value: 'all', label: 'All', api: 'all' },
    { value: 'delivered', label: 'Delivered', api: 'paid' },
    { value: 'shipped', label: 'Shipped', api: 'brand_paid' },
    { value: 'processing', label: 'Processing', api: 'order_form_filled' },
    { value: 'refunded', label: 'Refunded', api: 'refund_form_filled' },
    { value: 'cancelled', label: 'Cancelled', api: 'cancelled' },
  ];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private apiService: Apiservice,
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadOrders(1);
  }

  get isUserRole(): boolean {
    const storedRole = getTokenFromLocalStorage(STORAGE_KEYS.CURRENT_ROLE);
    const role = storedRole != null && storedRole !== '' ? Number(storedRole) : null;
    return role === ENTITY_TYPE_IDS.USER;
  }

  get totalCount(): number {
    const summaryTotal = this.statusSummary.reduce((sum, item) => sum + item.count, 0);
    return summaryTotal > 0 ? summaryTotal : this.totalOrders;
  }

  get orderPaginator(): PaginatedListView {
    return {
      loading: this.loading,
      total: this.totalOrders,
      currentPage: this.currentPage,
      lastPage: this.lastPage,
      perPage: this.perPage,
      pageNumbers: buildPageNumbers(this.currentPage, this.lastPage),
      showingFrom: showingFrom(this.totalOrders, this.currentPage, this.perPage),
      showingTo: showingTo(this.totalOrders, this.currentPage, this.perPage, this.orders.length),
      itemLabel: 'orders',
      goToPage: (page) => this.goToPage(page),
    };
  }

  summaryCount(key: string): number {
    return this.statusSummary.find((item) => item.key === key)?.count ?? 0;
  }

  setStatusPill(pill: { value: string; api: string }): void {
    this.activePill = pill.value;
    this.statusFilter = pill.api;
    this.selectedStatusKey = pill.api === 'all' ? null : pill.api;
    this.loadOrders(1);
  }

  orderTone(order: OrderHistoryRow): 'refunded' | 'delivered' | 'shipped' | 'processing' | 'cancelled' {
    const key = order.statusKey;
    if (key === 'refund_form_filled' || key === 'approved') {
      return 'refunded';
    }
    if (key === 'paid') {
      return 'delivered';
    }
    if (key === 'brand_paid') {
      return 'shipped';
    }
    if (key === 'cancelled' || key === 'rejected') {
      return 'cancelled';
    }
    return 'processing';
  }

  orderStatusText(order: OrderHistoryRow): string {
    const tone = this.orderTone(order);
    return tone.charAt(0).toUpperCase() + tone.slice(1);
  }

  get totalSpent(): number {
    if (this.paidAmount > 0) {
      return this.paidAmount;
    }
    return this.orders.reduce((sum, order) => {
      if (this.orderTone(order) === 'cancelled') {
        return sum;
      }
      return sum + (this.orderAmount(order) ?? 0);
    }, 0);
  }

  get refundsReceived(): number {
    return this.orders.reduce((sum, order) => {
      if (this.orderTone(order) !== 'refunded') {
        return sum;
      }
      return sum + (this.refundAmount(order) ?? 0);
    }, 0);
  }

  get inTransitCount(): number {
    const summaryTotal = this.statusSummary.reduce((sum, item) => sum + item.count, 0);
    if (summaryTotal > 0) {
      return this.summaryCount('brand_paid') + this.summaryCount('order_form_filled') + this.summaryCount('refill_requested');
    }
    return this.orders.filter((order) => {
      const tone = this.orderTone(order);
      return tone === 'shipped' || tone === 'processing';
    }).length;
  }

  refundAmount(order: OrderHistoryRow): number | null {
    const sources = [order.refundSubmission, order.raw, order.submission];
    const keys = ['refund_amount', 'refundAmount', 'refunded_amount'];
    for (const source of sources) {
      for (const key of keys) {
        const value = Number(source?.[key]);
        if (Number.isFinite(value) && value > 0) {
          return value;
        }
      }
    }
    return null;
  }

  orderMeta(order: OrderHistoryRow): string {
    const code = order.productCode !== '—' ? order.productCode : `ORD-${order.id}`;
    const parts = [code];
    if (order.companyName && order.companyName !== '—') {
      parts.push(order.companyName);
    }
    if (order.platform && order.platform !== '—') {
      parts.push(order.platform);
    }
    if (order.submittedShort) {
      parts.push(order.submittedShort);
    }
    return parts.join(' · ');
  }

  openOrder(order: OrderHistoryRow): void {
    this.expandedOrderId = order.id;
  }

  closeOrder(): void {
    this.expandedOrderId = null;
  }

  get openOrderRow(): OrderHistoryRow | null {
    if (this.expandedOrderId == null) {
      return null;
    }
    return this.orders.find((order) => order.id === this.expandedOrderId) ?? null;
  }

  orderAmount(order: OrderHistoryRow): number | null {
    const sources = [order.raw, order.submission, order.refundSubmission];
    const keys = ['amount', 'price', 'order_amount', 'paid_amount', 'product_price', 'refund_amount'];
    for (const source of sources) {
      for (const key of keys) {
        const value = Number(source?.[key]);
        if (Number.isFinite(value) && value > 0) {
          return value;
        }
      }
    }
    return null;
  }

  toggleStatusFilter(key: string): void {
    this.selectedStatusKey = this.selectedStatusKey === key ? null : key;
    this.statusFilter = this.selectedStatusKey ?? 'all';
    this.loadOrders(1);
  }

  applyFilters(): void {
    this.loadOrders(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage || page === this.currentPage) {
      return;
    }
    this.loadOrders(page);
  }

  orderRowNumber(index: number): number {
    if (!this.perPage) {
      return index + 1;
    }
    return (this.currentPage - 1) * this.perPage + index + 1;
  }

  formatCurrency(amount: number): string {
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount);
    return `₹${formatted}`;
  }

  private formatShortDate(value: unknown): string {
    if (!value) {
      return '';
    }
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  }

  getStatusBadgeClass(label: string): string {
    const lower = label.toLowerCase();
    if (lower.includes('paid') || lower.includes('approved') || lower.includes('accept')) {
      return 'oh-badge oh-badge--success';
    }
    if (lower.includes('reject') || lower.includes('cancel')) {
      return 'oh-badge oh-badge--danger';
    }
    if (lower.includes('refill') || lower.includes('pending')) {
      return 'oh-badge oh-badge--warning';
    }
    return 'oh-badge oh-badge--info';
  }

  getSubmissionFields(
    order: OrderHistoryRow,
    type: 'submission' | 'refund'
  ): SubmissionField[] {
    const payload = type === 'submission' ? order.submission : order.refundSubmission;
    const columns =
      type === 'submission'
        ? this.resolveFieldColumns(order, 'submission', this.formFieldColumns)
        : this.resolveFieldColumns(order, 'refund', this.refundFieldColumns);

    const labelLookup = new Map(columns.map((col) => [col.key, col.label]));

    const fields = Object.entries(payload).map(([key, field]) =>
      this.buildSubmissionField(
        key,
        this.resolveRefundFieldLabel(key, labelLookup.get(key) ?? key),
        field,
        type === 'refund'
      )
    );

    if (type === 'refund') {
      return this.mergeRefundMetaFields(order, fields);
    }

    return fields.filter((field) => field.value !== '—' || field.imageUrl);
  }

  private mergeRefundMetaFields(
    order: OrderHistoryRow,
    fields: SubmissionField[]
  ): SubmissionField[] {
    const existingKeys = new Set(fields.map((field) => field.key));
    const metaFields: SubmissionField[] = [];

    if (order.refundRemark && order.refundRemark !== '—' && !existingKeys.has('accept_reject_remark')) {
      metaFields.push({
        key: 'accept_reject_remark',
        label: REFUND_META_FIELD_LABELS['accept_reject_remark'],
        value: order.refundRemark,
        imageUrl: null,
      });
    }

    if (order.refundPaymentImage && !existingKeys.has('accept_reject_screenshot')) {
      metaFields.push({
        key: 'accept_reject_screenshot',
        label: REFUND_META_FIELD_LABELS['accept_reject_screenshot'],
        value: '—',
        imageUrl: order.refundPaymentImage,
      });
    }

    return [...fields, ...metaFields].filter(
      (field) => field.value !== '—' || field.imageUrl
    );
  }

  private resolveRefundFieldLabel(key: string, fallback: string): string {
    return REFUND_META_FIELD_LABELS[key] ?? fallback;
  }

  private resolveFieldColumns(
    order: OrderHistoryRow,
    type: 'submission' | 'refund',
    globalColumns: SubmissionFieldColumn[]
  ): SubmissionFieldColumn[] {
    const record = this.resolveSubmissionRecord(order.raw);
    const rawHeads =
      type === 'submission'
        ? order.raw['form_heads'] ?? record['form_heads']
        : order.raw['form_submission_heads'] ??
          order.raw['refund_form_heads'] ??
          record['form_submission_heads'] ??
          record['refund_form_heads'] ??
          record['submission_text_heads'];

    const rowColumns = this.normalizeHeads(
      rawHeads,
      type === 'submission' ? 'submission' : 'refund_submission_text'
    );

    return rowColumns.length ? rowColumns : globalColumns;
  }

  hasSubmissionFields(order: OrderHistoryRow, type: 'submission' | 'refund'): boolean {
    return this.getSubmissionFields(order, type).length > 0;
  }

  canRequestRefund(order: OrderHistoryRow): boolean {
    return order.statusLabel.toLowerCase() === 'submitted'
      ? this.isUserRole && order.refundSubmissionCount === 0
      : false;
  }

  canViewRefund(order: OrderHistoryRow): boolean {
    return order.refundSubmissionCount > 0;
  }

  openProductLink(link: string): void {
    if (link) {
      window.open(link, '_blank', 'noopener');
    }
  }

  refundSubmission(order: OrderHistoryRow): void {
    if (!order.id) {
      return;
    }
    this.router.navigate(['/refundform', order.id]);
  }

  viewRefundSubmission(order: OrderHistoryRow): void {
    if (!order.id) {
      return;
    }
    this.router.navigate(['/refund/submission', order.id]);
  }

  exportCsv(): void {
    const headers = [
      'Product',
      'Brand',
      'Platform',
      'Product Link',
      'Status',
      'Remark',
      'Submitted',
    ];
    const rows = this.orders.map((order) => [
      order.productName,
      order.brandName,
      order.platform,
      order.productLink,
      order.statusLabel,
      order.refundRemark,
      order.submittedAt,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'order-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  private loadUserInfo(): void {
    const data = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ);
    this.token = data?.token ?? null;
    const name = data?.user?.name?.trim() || data?.user?.email?.split('@')[0] || 'there';
    this.userName = name;
    this.userInitials = name
      .split(/\s+/)
      .map((part: string) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  private loadOrders(page: number): void {
    if (!this.token) {
      this.loadError = 'Please log in to view order history.';
      return;
    }

    this.loading = true;
    this.loadError = '';

    this.apiService
      .getUserOrderHistory(this.token, page, this.perPage, {
        search: this.searchQuery.trim() || undefined,
        status: this.statusFilter !== 'all' ? this.statusFilter : undefined,
        platform: this.platformFilter !== 'all' ? this.platformFilter : undefined,
        sort: this.sortOrder,
        dateFrom: this.dateFrom || undefined,
        dateTo: this.dateTo || undefined,
      })
      .subscribe({
        next: (res: unknown) => {
          this.applyApiResponse(res, page);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: { error?: { message?: string }; message?: string }) => {
          console.error(err);
          this.orders = [];
          this.loadError = err?.error?.message ?? err?.message ?? 'Failed to load order history.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private applyApiResponse(res: unknown, requestedPage: number): void {
    const parsed = parsePaginatedResponse(res, requestedPage);
    const redirect = getPaginationRedirectPage(parsed, requestedPage);
    if (redirect !== null) {
      this.loadOrders(redirect);
      return;
    }

    const payload = (res as { data?: Record<string, unknown> })?.data ?? {};
    this.extractSummary(payload, res);
    this.extractSubmissionHeads(res);
    this.orders = parsed.items.map((item) => this.mapOrderRow(item as Record<string, unknown>));
    this.ensureSubmissionFieldColumns();
    this.currentPage = parsed.currentPage;
    this.lastPage = parsed.lastPage;
    this.totalOrders = parsed.total;
    this.perPage = parsed.perPage || this.perPage;
    this.updatePlatformOptions();
  }

  private extractSummary(payload: Record<string, unknown>, res: unknown): void {
    const root = (res as { data?: Record<string, unknown> })?.data ?? {};
    const summarySource =
      payload['status_summary'] ??
      payload['statuses'] ??
      payload['stats'] ??
      root['status_summary'] ??
      root['statuses'] ??
      root['stats'];

    if (Array.isArray(summarySource) && summarySource.length) {
      this.statusSummary = summarySource.map((item, index) => {
        const row = item as Record<string, unknown>;
        return {
          key: String(row['key'] ?? row['status'] ?? row['id'] ?? index),
          label: String(row['label'] ?? row['name'] ?? row['title'] ?? 'Status'),
          count: Number(row['count'] ?? row['total'] ?? row['value'] ?? 0),
        };
      });
    }

    const paid =
      payload['paid_amount'] ??
      payload['paid'] ??
      root['paid_amount'] ??
      root['paid'];
    const paidNumber = Number(paid);
    if (Number.isFinite(paidNumber)) {
      this.paidAmount = paidNumber;
    }
  }

  private updatePlatformOptions(): void {
    const unique = new Set<string>(['all']);
    for (const order of this.orders) {
      if (order.platform && order.platform !== '—') {
        unique.add(order.platform);
      }
    }
    this.platforms = [...unique];
  }

  private mapOrderRow(raw: Record<string, unknown>): OrderHistoryRow {
    const record = this.resolveSubmissionRecord(raw);
    const product = this.resolveProductSource(raw, record);

    const submission = this.resolveFormSubmissionPayload(raw, record);
    const refundSubmission = this.resolveRefundSubmissionPayload(raw, record);

    const refundSubmissionCount = this.readNumber(
      record['refund_submission_count'] ?? record['refundSubmissionCount'],
      0
    );
    const refundAcceptStatus = this.readNullableNumber(record['refund_accept_status']);

    console.log(record);
    if(record['refund_image_url']){
      console.log(record['refund_image_url']);
    }
    return {
      raw,
      id: this.readId(record['id'] ?? record['submission_id'] ?? record['order_id']),
      productName: this.readString(
        product['name'] ??
          product['product_name'] ??
          record['product_name'] ??
          record['revo_product_name'] ??
          record['name'],
        '—'
      ),
      productLabel: this.resolveProductLabel(raw, record, product),
      productImageUrl: this.resolveProductImageUrl(raw, record, product),
      productCode: this.readString(
        product['product_code'] ??
          record['product_code'] ??
          record['brand_code'] ??
          product['code'],
        '—'
      ),
      brandName: this.readString(
        product['brand_name'] ??
          record['brand_name'] ??
          product['brand'] ??
          record['revo_brand_name'],
        '—'
      ),
      companyName: this.readString(
        record['company_alias'] ??
          record['company_name'] ??
          product['company_alias'] ??
          product['company_name'] ??
          record['revo_company_alias'] ??
          record['revo_company_name'],
        '—'
      ),
      platform: this.readString(
        product['platform'] ??
          record['platform'] ??
          product['revo_platform'] ??
          record['revo_platform_name'],
        '—'
      ),
      orderType: this.readString(
        product['order_type'] ?? record['order_type'] ?? product['type'] ?? record['type'],
        '—'
      ),
      submittedAt: this.formatDate(
        record['created_on'] ??
          record['created_at'] ??
          record['submitted_at'] ??
          record['updated_at']
      ),
      submittedShort: this.formatShortDate(
        record['created_on'] ??
          record['created_at'] ??
          record['submitted_at'] ??
          record['updated_at']
      ),
      productLink: this.resolveProductLink(record, product, submission),
      submission,
      refundSubmission: this.enrichRefundSubmission(record, refundSubmission),
      statusLabel: this.resolveStatusLabel(record, refundSubmissionCount, refundAcceptStatus),
      statusKey: this.resolveStatusKey(record, refundSubmissionCount, refundAcceptStatus),
      refundRemark: this.readString(
        record['accept_reject_remark'] ??
          record['refund_accept_reject_remark'] ??
          record['status_remark'] ??
          record['remark']??
          record['refund_remark'],
        '—'
      ),
      refundPaymentImage: this.resolveRefundPaymentImage(
        record['accept_reject_screenshot'] ??
          record['refund_accept_reject_screenshot'] ??
          record['refund_payment_image']??
          record['refund_image_url']
      ),
      refundSubmissionCount,
      refundAcceptStatus,
      promoteId: this.readOptionalId(
        record['promote_id'] ??
          record['product_promote_id'] ??
          product['promote_id'] ??
          product['id']
      ),
    };
    
  }

  private resolveSubmissionRecord(raw: Record<string, unknown>): Record<string, unknown> {
    const block = raw['form_submission'];
    if (block && typeof block === 'object' && !Array.isArray(block)) {
      return { ...raw, ...(block as Record<string, unknown>) };
    }
    return raw;
  }

  private extractSubmissionHeads(res: unknown): void {
    const payload = (res as { data?: Record<string, unknown> })?.data;
    this.formFieldColumns = this.normalizeHeads(payload?.['form_heads'], 'submission');
    this.refundFieldColumns = this.normalizeHeads(
      payload?.['form_submission_heads'] ??
        payload?.['refund_form_heads'] ??
        payload?.['refund_heads'] ??
        payload?.['submission_text_heads'],
      'refund_submission_text'
    );
  }

  private resolveFormSubmissionPayload(
    raw: Record<string, unknown>,
    record: Record<string, unknown>
  ): Record<string, unknown> {
    const formBlock = raw['form_submission'];
    const candidates: unknown[] = [
      record['submission'],
      this.extractSubmissionFromBlock(formBlock),
      record['form_submission'],
    ];

    for (const candidate of candidates) {
      const parsed = this.parseSubmissionPayload(candidate);
      if (Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
    return {};
  }

  private resolveRefundSubmissionPayload(
    raw: Record<string, unknown>,
    record: Record<string, unknown>
  ): Record<string, unknown> {
    const formBlock = raw['form_submission'];
    const refundFormBlock = raw['refund_form_submission'];
    const refundBlock =
      record['refund_submission'] ??
      record['refundSubmission'] ??
      (refundFormBlock && typeof refundFormBlock === 'object' ? refundFormBlock : null);

    const formSubmissionText =
      formBlock && typeof formBlock === 'object' && !Array.isArray(formBlock)
        ? (formBlock as Record<string, unknown>)['submission_text']
        : null;

    const candidates: unknown[] = [
      record['refund_submission_text'],
      record['submission_text'],
      formSubmissionText,
      this.extractSubmissionFromBlock(refundBlock),
      this.extractSubmissionFromBlock(record['refundSubmission']),
      this.extractSubmissionFromBlock(record['refund_submission']),
      this.extractSubmissionFromBlock(raw['refund_submission']),
      this.extractSubmissionFromBlock(refundFormBlock),
      refundBlock,
    ];

    for (const candidate of candidates) {
      const parsed = this.parseSubmissionPayload(candidate);
      if (Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
    return {};
  }

  private extractSubmissionFromBlock(block: unknown): unknown {
    if (!block || typeof block !== 'object' || Array.isArray(block)) {
      return null;
    }

    const obj = block as Record<string, unknown>;
    if (obj['submission'] != null) {
      return obj['submission'];
    }
    if (obj['refund_submission_text'] != null) {
      return obj['refund_submission_text'];
    }
    if (obj['submission_text'] != null) {
      return obj['submission_text'];
    }

    const keys = Object.keys(obj);
    const looksLikeFieldMap = keys.some((key) => {
      const field = obj[key];
      return (
        field != null &&
        typeof field === 'object' &&
        ('value' in (field as object) || 'label' in (field as object))
      );
    });

    return looksLikeFieldMap ? obj : null;
  }

  private enrichRefundSubmission(
    record: Record<string, unknown>,
    refundSubmission: Record<string, unknown>
  ): Record<string, unknown> {
    const enriched = { ...refundSubmission };

    const remark =
      record['accept_reject_remark'] ?? record['refund_accept_reject_remark'];
    const screenshot =
      record['accept_reject_screenshot'] ?? record['refund_accept_reject_screenshot'];

    if (remark != null && remark !== '' && enriched['accept_reject_remark'] == null) {
      enriched['accept_reject_remark'] = {
        label: REFUND_META_FIELD_LABELS['accept_reject_remark'],
        value: remark,
      };
    }

    if (screenshot != null && screenshot !== '' && enriched['accept_reject_screenshot'] == null) {
      enriched['accept_reject_screenshot'] = {
        label: REFUND_META_FIELD_LABELS['accept_reject_screenshot'],
        value: screenshot,
        type: 'image',
      };
    }

    return enriched;
  }

  private buildSubmissionField(
    key: string,
    fallbackLabel: string,
    rawField: unknown,
    isRefundField = false
  ): SubmissionField {
    const label = this.getFieldLabel(
      rawField,
      isRefundField ? this.resolveRefundFieldLabel(key, fallbackLabel) : fallbackLabel
    );
    const value = this.getFieldValue(rawField);
    const imageUrl = this.resolveFieldImageUrl(rawField, value, key);
    return {
      key,
      label,
      value: imageUrl ? '—' : value,
      imageUrl,
    };
  }

  private resolveFieldImageUrl(
    field: unknown,
    value: string,
    key = ''
  ): string | null {
    if (value === '—' && !key.includes('screenshot') && !key.includes('image')) {
      return null;
    }

    const rawValue =
      field && typeof field === 'object' && field !== null && 'value' in field
        ? (field as { value: unknown }).value
        : field;

    const fieldType =
      field && typeof field === 'object' && field !== null && 'type' in field
        ? String((field as { type: unknown }).type).toLowerCase()
        : '';

    const looksLikeImageField =
      key.includes('screenshot') ||
      key.includes('image') ||
      fieldType.includes('image') ||
      fieldType.includes('file') ||
      fieldType.includes('photo') ||
      /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(value) ||
      value.includes('uploads/') ||
      (rawValue != null &&
        String(rawValue).includes('uploads/'));

    if (!looksLikeImageField) {
      return null;
    }

    const imageSource = rawValue ?? value;

    return (
      this.resolveUploadImageUrl(imageSource, IMAGE_FOLDERS.REFUNDS) ??
      this.resolveUploadImageUrl(imageSource, IMAGE_FOLDERS.PRODUCTS)
    );
  }

  private normalizeHeads(
    heads: unknown,
    source: SubmissionFieldColumn['source']
  ): SubmissionFieldColumn[] {
    if (!heads) {
      return [];
    }

    if (Array.isArray(heads)) {
      return heads.map((head, index) => {
        if (typeof head === 'string') {
          return { key: head, label: head, source };
        }
        if (head && typeof head === 'object') {
          const h = head as Record<string, unknown>;
          const key = String(h['key'] ?? h['id'] ?? h['name'] ?? index);
          const label = String(h['label'] ?? h['title'] ?? h['head'] ?? h['key'] ?? key);
          return { key, label, source };
        }
        return { key: String(index), label: String(head), source };
      });
    }

    if (typeof heads === 'object') {
      return Object.entries(heads as Record<string, unknown>).map(([key, label]) => ({
        key,
        label: String(label),
        source,
      }));
    }

    return [];
  }

  private getFieldValueFromPayload(
    payload: Record<string, unknown>,
    key: string
  ): string {
    return this.getFieldValue(payload[key]);
  }

  private ensureSubmissionFieldColumns(): void {
    if (!this.formFieldColumns.length) {
      this.formFieldColumns = this.inferColumnsFromOrders('submission');
    }
    if (!this.refundFieldColumns.length) {
      this.refundFieldColumns = this.inferColumnsFromOrders('refund_submission_text');
    }
  }

  private inferColumnsFromOrders(
    source: SubmissionFieldColumn['source']
  ): SubmissionFieldColumn[] {
    const columns: SubmissionFieldColumn[] = [];
    const seen = new Set<string>();

    for (const order of this.orders) {
      const payload =
        source === 'submission' ? order.submission : order.refundSubmission;
      for (const key of Object.keys(payload)) {
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        columns.push({
          key,
          label: this.getFieldLabel(payload[key], key),
          source,
        });
      }
    }

    return columns;
  }

  private resolveStatusLabel(
    raw: Record<string, unknown>,
    refundCount: number,
    refundAcceptStatus: number | null
  ): string {
    if (refundAcceptStatus === 1) {
      return 'Approved';
    }
    if (refundAcceptStatus === 2) {
      return 'Rejected';
    }
    if (refundCount > 0) {
      return 'Refund form filled';
    }

    const status = raw['status'] ?? raw['order_status'] ?? raw['submission_status'];
    if (status != null && status !== '') {
      return String(status).replace(/_/g, ' ');
    }
    return 'Order form filled';
  }

  private resolveStatusKey(
    raw: Record<string, unknown>,
    refundCount: number,
    refundAcceptStatus: number | null
  ): string {
    if (refundAcceptStatus === 1) {
      return 'approved';
    }
    if (refundAcceptStatus === 2) {
      return 'rejected';
    }
    if (refundCount > 0) {
      return 'refund_form_filled';
    }

    const status = String(raw['status'] ?? raw['order_status'] ?? 'order_form_filled')
      .toLowerCase()
      .replace(/\s+/g, '_');
    return status;
  }

  private resolveProductSource(
    raw: Record<string, unknown>,
    record: Record<string, unknown>
  ): Record<string, unknown> {
    const nested =
      raw['product'] ??
      raw['promoted_product'] ??
      raw['product_details'] ??
      raw['productDetails'] ??
      record['product'] ??
      record['promoted_product'] ??
      record['product_details'];

    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
    return {};
  }

  private resolveProductLabel(
    raw: Record<string, unknown>,
    record: Record<string, unknown>,
    product: Record<string, unknown>
  ): string {
    return this.readString(
      product['product_label'] ??
        product['label'] ??
        record['product_label'] ??
        record['label'] ??
        raw['product_label'] ??
        raw['label'] ??
        product['revo_product_label'] ??
        record['revo_product_label'],
      ''
    );
  }

  private resolveProductImageUrl(
    raw: Record<string, unknown>,
    record: Record<string, unknown>,
    product: Record<string, unknown>
  ): string | null {
    const candidates = [
      product['product_image'],
      product['photo'],
      product['image'],
      record['product_image'],
      record['photo'],
      record['image'],
      raw['product_image'],
      raw['photo'],
      raw['image'],
      product['revo_product_image'],
      record['revo_product_image'],
    ];

    for (const candidate of candidates) {
      const url = this.resolveUploadImageUrl(candidate, IMAGE_FOLDERS.PRODUCTS);
      if (url) {
        return url;
      }
    }
    return null;
  }

  private resolveUploadImageUrl(
    value: unknown,
    folder: string
  ): string | null {
    if (value == null || value === '') {
      return null;
    }

    if (typeof value === 'object' && value !== null) {
      const record = value as Record<string, unknown>;
      const nested =
        record['url'] ?? record['path'] ?? record['src'] ?? record['image'];
      if (nested != null && nested !== value) {
        return this.resolveUploadImageUrl(nested, folder);
      }
    }

    const path = String(value).trim();
    if (!path) {
      return null;
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const base = this.imageBaseUrl.endsWith('/')
      ? this.imageBaseUrl
      : `${this.imageBaseUrl}/`;

    if (path.startsWith('uploads/')) {
      return base.replace(/uploads\/?$/, '') + path;
    }

    if (path.includes('/')) {
      return `${base}${path.replace(/^\//, '')}`;
    }
    return `${base}${folder}/${path}`;
  }

  private resolveProductLink(
    raw: Record<string, unknown>,
    product: Record<string, unknown>,
    submission: Record<string, unknown>
  ): string {
    const candidates = [
      raw['product_link'],
      product['product_link'],
      product['revo_product_link'],
      submission['product_link'],
      submission['product_url'],
    ];

    for (const candidate of candidates) {
      const value = this.getFieldValue(candidate);
      if (value !== '—') {
        return value;
      }
    }
    return '';
  }

  private resolveRefundPaymentImage(screenshot: unknown): string | null {
    console.log(screenshot);
    return this.resolveUploadImageUrl(screenshot, IMAGE_FOLDERS.REFUNDS);
  }

  private parseSubmissionPayload(data: unknown): Record<string, unknown> {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return parsed && typeof parsed === 'object'
          ? (parsed as Record<string, unknown>)
          : {};
      } catch {
        return {};
      }
    }
    if (data && typeof data === 'object') {
      return data as Record<string, unknown>;
    }
    return {};
  }

  private getFieldLabel(field: unknown, fallback: string): string {
    if (field && typeof field === 'object' && field !== null) {
      const record = field as Record<string, unknown>;
      if (record['label'] != null && record['label'] !== '') {
        return String(record['label']);
      }
      if (record['head'] != null && record['head'] !== '') {
        return String(record['head']);
      }
      if (record['title'] != null && record['title'] !== '') {
        return String(record['title']);
      }
    }
    return fallback;
  }

  private getFieldValue(field: unknown): string {
    if (field == null || field === '') {
      return '—';
    }
    if (typeof field === 'object' && field !== null && 'value' in field) {
      return this.formatValue((field as { value: unknown }).value);
    }
    return this.formatValue(field);
  }

  private formatValue(value: unknown): string {
    if (value == null || value === '') {
      return '—';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  }

  private formatDate(value: unknown): string {
    if (!value) {
      return '—';
    }
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private readId(value: unknown): string | number {
    if (value == null || value === '') {
      return '';
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    return String(value);
  }

  private readOptionalId(value: unknown): string | number | undefined {
    if (value == null || value === '') {
      return undefined;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    return String(value);
  }

  private readString(value: unknown, fallback: string): string {
    if (value == null || value === '') {
      return fallback;
    }
    return String(value);
  }

  private readNumber(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  private readNullableNumber(value: unknown): number | null {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
}
