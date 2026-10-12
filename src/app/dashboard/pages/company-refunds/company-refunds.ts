import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ENTITY_TYPE_IDS,
  getTokenFromLocalStorage,
  IMAGE_FOLDERS,
  STORAGE_KEYS,
} from '../../../../constants/app.constants';
import { environment } from '../../../../environments/environment';
import { Apiservice } from '../../../../services/apiservice';

type RefundStatus = 'under_review' | 'paid' | 'rejected';

interface RefundRow {
  id: string | number;
  submission_id: string | number;
  product_name: string;
  brand_name?: string;
  company_name: string;
  revo_user_name: string;
  order_id: string;
  product_price: number | null;
  less: number | null;
  expected_price: number | null;
  review_link: string;
  status: RefundStatus;
  remark: string;
  screenshot: string;
  created_on: string;
  updated_on: string;
}

@Component({
  selector: 'app-company-refunds',
  imports: [CommonModule, FormsModule],
  templateUrl: './company-refunds.html',
  styleUrls: ['../company-portal/company-portal.css'],
})
export class CompanyRefunds implements OnInit {
  query = '';
  status: 'all' | RefundStatus = 'all';
  loading = true;
  loadError = '';
  rows: RefundRow[] = [];
  selected: RefundRow | null = null;

  readonly pills = [
    { value: 'all' as const, label: 'All' },
    { value: 'under_review' as const, label: 'Under review' },
    { value: 'paid' as const, label: 'Refunded' },
    { value: 'rejected' as const, label: 'Rejected' },
  ];

  private token = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.token || '';

  constructor(
    private api: Apiservice,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const role = Number(getTokenFromLocalStorage(STORAGE_KEYS.CURRENT_ROLE));
    if (role !== ENTITY_TYPE_IDS.COMPANY) {
      this.router.navigate(['/']);
      return;
    }
    this.load();
  }

  get filtered(): RefundRow[] {
    const query = this.query.trim().toLowerCase();
    return this.rows.filter((row) => {
      if (this.status !== 'all' && row.status !== this.status) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [
        row.order_id,
        row.product_name,
        row.brand_name,
        row.company_name,
        row.revo_user_name,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  get orderValue(): number {
    return this.rows.reduce((sum, row) => sum + (Number(row.product_price) || 0), 0);
  }

  get refundsIssued(): number {
    return this.rows
      .filter((row) => row.status === 'paid')
      .reduce((sum, row) => sum + (Number(row.expected_price) || 0), 0);
  }

  get inTransit(): number {
    return this.rows.filter((row) => row.status === 'under_review').length;
  }

  setStatus(value: 'all' | RefundStatus): void {
    this.status = value;
  }

  open(row: RefundRow): void {
    this.selected = row;
  }

  close(): void {
    this.selected = null;
  }

  money(value: number | null | undefined): string {
    if (value == null || Number.isNaN(Number(value))) {
      return '—';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(value));
  }

  statusLabel(status: RefundStatus): string {
    if (status === 'paid') {
      return 'Refunded';
    }
    if (status === 'rejected') {
      return 'Rejected';
    }
    return 'Under review';
  }

  statusIcon(status: RefundStatus): string {
    if (status === 'paid') {
      return 'fa-undo';
    }
    if (status === 'rejected') {
      return 'fa-times';
    }
    return 'fa-clock-o';
  }

  formatWhen(value: string): string {
    if (!value) {
      return '—';
    }
    const date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date);
  }

  statusClass(status: RefundStatus): string {
    if (status === 'paid') {
      return 'cp-badge--paid';
    }
    if (status === 'rejected') {
      return 'cp-badge--rejected';
    }
    return 'cp-badge--review';
  }

  screenshotUrl(row: RefundRow): string | null {
    if (!row.screenshot) {
      return null;
    }
    if (/^https?:\/\//i.test(row.screenshot)) {
      return row.screenshot;
    }
    const base = environment.imageBaseUrl.endsWith('/')
      ? environment.imageBaseUrl
      : `${environment.imageBaseUrl}/`;
    return `${base}${IMAGE_FOLDERS.REFUNDS}/${row.screenshot}`;
  }

  exportCsv(): void {
    const header = 'Order,Product,Member,Price,Less,Expected price,Review link,Status\n';
    const lines = this.filtered.map((row) =>
      [
        row.order_id,
        row.product_name,
        row.revo_user_name,
        row.product_price ?? '',
        row.less ?? '',
        row.expected_price ?? '',
        row.review_link,
        this.statusLabel(row.status),
      ]
        .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );
    const blob = new Blob([header + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'revo-company-refunds.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  private load(): void {
    if (!this.token) {
      this.loading = false;
      this.loadError = 'Please log in to view refunds.';
      this.cdr.detectChanges();
      return;
    }
    this.loading = true;
    this.loadPage(1, []);
  }

  private loadPage(page: number, collected: RefundRow[]): void {
    this.api
      .getCompanyRefunds(this.token, page, 100)
      .subscribe({
        next: (res: any) => {
          const payload = res?.data ?? {};
          const items = Array.isArray(payload.data) ? payload.data : [];
          const all = collected.concat(items);
          const lastPage = Math.max(1, Number(payload.pagination?.total_pages ?? 1));
          if (page < lastPage) {
            this.loadPage(page + 1, all);
            return;
          }
          this.rows = all;
          this.loading = false;
          this.loadError = '';
          this.cdr.detectChanges();
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.rows = [];
          this.loading = false;
          this.loadError = error?.error?.message || error?.message || 'Failed to load refunds.';
          this.cdr.detectChanges();
        },
      });
  }
}
