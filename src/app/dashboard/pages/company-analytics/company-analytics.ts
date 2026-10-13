import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import {
  ENTITY_TYPE_IDS,
  getTokenFromLocalStorage,
  STORAGE_KEYS,
} from '../../../../constants/app.constants';
import { Apiservice } from '../../../../services/apiservice';

type Metric = 'submissions' | 'orders' | 'refunds';
type Listing = 'active' | 'archived';
type SubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'paid' | 'rejected';

interface StatusSlice {
  key: string;
  label: string;
  count: number;
}

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  listing: Listing;
  submissions: number;
  rate: number;
  value: number;
}

interface ChartBucket {
  label: string;
  value: number;
  start: number;
  end: number;
}

interface SubmissionRecord {
  id: string;
  productId: string;
  productName: string;
  status: SubmissionStatus;
  createdOn: string;
  price: number;
}

interface RefundRecord {
  id: string;
  createdOn: string;
  expected: number;
}

interface ProductRecord {
  id: string;
  name: string;
  brand: string;
  status: number;
}

@Component({
  selector: 'app-company-analytics',
  imports: [CommonModule, FormsModule],
  templateUrl: './company-analytics.html',
  styleUrls: ['../company-portal/company-portal.css', './company-analytics.css'],
})
export class CompanyAnalytics implements OnInit {
  period = 'all';
  metric: Metric = 'submissions';
  loading = true;
  loadError = '';

  readonly periods = [
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
    { value: '365', label: '12 months' },
    { value: 'all', label: 'All time' },
  ];

  readonly metrics: { value: Metric; label: string }[] = [
    { value: 'submissions', label: 'Submissions' },
    { value: 'orders', label: 'Order value' },
    { value: 'refunds', label: 'Refund value' },
  ];

  private submissions: SubmissionRecord[] = [];
  private refunds: RefundRecord[] = [];
  private catalog: ProductRecord[] = [];
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

  get stats(): { label: string; value: string; note: string; icon: string }[] {
    const active = this.catalog.filter((item) => item.status === 1).length;
    return [
      {
        label: 'Submissions',
        value: this.formatCount(this.submissionTotal),
        note: `${this.formatCount(this.pendingReview)} need review`,
        icon: 'fa-file-text-o',
      },
      {
        label: 'Approval rate',
        value: `${this.approvalRate}%`,
        note: `${this.formatCount(this.accepted)} paid`,
        icon: 'fa-check',
      },
      {
        label: 'Product listings',
        value: String(this.catalog.length),
        note: `${active} promoted`,
        icon: 'fa-cube',
      },
      {
        label: 'Order value',
        value: this.inr(this.orderValue),
        note: `${this.formatCount(this.orderCount)} orders in period`,
        icon: 'fa-shopping-bag',
      },
    ];
  }

  get statuses(): StatusSlice[] {
    const rows = this.periodSubmissions;
    const count = (key: SubmissionStatus) => rows.filter((row) => row.status === key).length;
    return [
      { key: 'submitted', label: 'Submitted', count: count('submitted') },
      { key: 'under_review', label: 'In review', count: count('under_review') },
      { key: 'approved', label: 'Approved', count: count('approved') },
      { key: 'paid', label: 'Paid', count: count('paid') },
      { key: 'rejected', label: 'Rejected', count: count('rejected') },
    ];
  }

  get products(): ProductRow[] {
    const rows = this.periodSubmissions;
    const known = new Map(this.catalog.map((item) => [item.id, item]));
    const ids = new Set<string>([...this.catalog.map((item) => item.id), ...rows.map((row) => row.productId)]);

    return [...ids]
      .filter((id) => id !== '')
      .map((id) => {
        const product = known.get(id);
        const productRows = rows.filter((row) => row.productId === id);
        const paid = productRows.filter((row) => row.status === 'paid').length;
        const rejected = productRows.filter((row) => row.status === 'rejected').length;
        const reviewed = paid + rejected;
        const name = product?.name || productRows[0]?.productName || 'Product';
        return {
          id,
          name,
          brand: product?.brand || '',
          listing: product?.status === 2 ? 'archived' : 'active',
          submissions: productRows.length,
          rate: reviewed ? Math.round((paid / reviewed) * 100) : 0,
          value: productRows.reduce((sum, row) => sum + row.price, 0),
        } as ProductRow;
      })
      .sort((a, b) => b.submissions - a.submissions || b.value - a.value);
  }

  get buckets(): ChartBucket[] {
    const ranges = this.bucketRanges();
    return ranges.map((range) => {
      const value =
        this.metric === 'submissions'
          ? this.periodSubmissions.filter((row) => this.inRange(row.createdOn, range)).length
          : this.metric === 'orders'
            ? this.periodSubmissions
                .filter((row) => this.inRange(row.createdOn, range))
                .reduce((sum, row) => sum + row.price, 0)
            : this.periodRefunds
                .filter((row) => this.inRange(row.createdOn, range))
                .reduce((sum, row) => sum + row.expected, 0);
      return { label: range.label, value, start: range.start, end: range.end };
    });
  }

  get chartTitle(): string {
    if (this.metric === 'orders') return 'Order value';
    if (this.metric === 'refunds') return 'Refund value';
    return 'Submissions';
  }

  get chartTotal(): string {
    const total = this.buckets.reduce((sum, bucket) => sum + bucket.value, 0);
    return this.metric === 'submissions' ? this.formatCount(total) : this.inr(total);
  }

  get chartNote(): string {
    const labels: Record<string, string> = {
      '30': '30 days',
      '90': '90 days',
      '365': '12 months',
      all: 'All time',
    };
    if (this.period === 'all') {
      return 'Monthly totals for the rolling 12-month view';
    }
    return `Activity in the last ${(labels[this.period] ?? this.period).toLowerCase()}`;
  }

  get submissionTotal(): number {
    return this.periodSubmissions.length;
  }

  get pendingReview(): number {
    return this.periodSubmissions.filter(
      (row) => row.status === 'submitted' || row.status === 'under_review',
    ).length;
  }

  get accepted(): number {
    return this.periodSubmissions.filter((row) => row.status === 'paid').length;
  }

  get approvalRate(): number {
    const paid = this.accepted;
    const rejected = this.periodSubmissions.filter((row) => row.status === 'rejected').length;
    const reviewed = paid + rejected;
    return reviewed ? Math.round((paid / reviewed) * 100) : 0;
  }

  get orderCount(): number {
    return this.periodSubmissions.filter((row) => row.price > 0).length;
  }

  get orderValue(): number {
    return this.periodSubmissions.reduce((sum, row) => sum + row.price, 0);
  }

  get refundValue(): number {
    return this.periodRefunds.reduce((sum, row) => sum + row.expected, 0);
  }

  share(count: number): number {
    return this.submissionTotal ? Math.round((count / this.submissionTotal) * 100) : 0;
  }

  barHeight(value: number): number {
    const max = Math.max(1, ...this.buckets.map((bucket) => bucket.value));
    return Math.max(4, (value / max) * 100);
  }

  bucketLabel(value: number): string {
    return this.metric === 'submissions' ? this.formatCount(value) : this.inr(value);
  }

  inr(amount: number): string {
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;
  }

  exportReport(): void {
    const period = this.periods.find((item) => item.value === this.period)?.label ?? this.period;
    const rows = [
      ['Metric', 'Value', 'Period'],
      ...this.stats.map((stat) => [stat.label, stat.value, period]),
      ['Pending review', String(this.pendingReview), period],
      ['Paid submissions', String(this.accepted), period],
      ['Order value', String(this.orderValue), period],
      ['Refund value', String(this.refundValue), period],
      [],
      ['Product', 'Brand', 'Listing', 'Submissions', 'Approval rate', 'Order value'],
      ...this.products.map((row) => [
        row.name,
        row.brand,
        row.listing,
        String(row.submissions),
        `${row.rate}%`,
        String(row.value),
      ]),
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'revo-company-analytics.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  private get periodSubmissions(): SubmissionRecord[] {
    return this.submissions.filter((row) => this.inPeriod(row.createdOn));
  }

  private get periodRefunds(): RefundRecord[] {
    return this.refunds.filter((row) => this.inPeriod(row.createdOn));
  }

  private load(): void {
    if (!this.token) {
      this.loading = false;
      this.loadError = 'Please log in to view analytics.';
      this.cdr.detectChanges();
      return;
    }

    forkJoin({
      submissions: this.loadPages((page) => this.api.getCompanySubmissions(this.token, page, 100)),
      refunds: this.loadPages((page) => this.api.getCompanyRefunds(this.token, page, 100)),
      products: this.loadPages((page) => this.api.getProductsByCompany(this.token, page, undefined, 100)),
    }).subscribe({
      next: ({ submissions, refunds, products }) => {
        this.submissions = submissions.map((row) => this.toSubmission(row));
        this.refunds = refunds.map((row) => this.toRefund(row));
        this.catalog = products.map((row) => this.toProduct(row));
        this.loading = false;
        this.loadError = '';
        this.cdr.detectChanges();
      },
      error: (error: { error?: { message?: string }; message?: string }) => {
        this.submissions = [];
        this.refunds = [];
        this.catalog = [];
        this.loading = false;
        this.loadError = error?.error?.message || error?.message || 'Failed to load analytics.';
        this.cdr.detectChanges();
      },
    });
  }

  private loadPages(fetchPage: (page: number) => Observable<any>): Observable<any[]> {
    return new Observable((subscriber) => {
      const collected: any[] = [];
      const nextPage = (page: number) => {
        fetchPage(page).subscribe({
          next: (res: any) => {
            const payload = res?.data ?? {};
            const items = Array.isArray(payload.data) ? payload.data : [];
            collected.push(...items);
            const lastPage = Math.max(1, Number(payload.pagination?.total_pages ?? 1));
            if (page < lastPage) {
              nextPage(page + 1);
              return;
            }
            subscriber.next(collected);
            subscriber.complete();
          },
          error: (error) => subscriber.error(error),
        });
      };
      nextPage(1);
    });
  }

  private toSubmission(row: any): SubmissionRecord {
    const status = String(row.status || 'submitted') as SubmissionStatus;
    return {
      id: String(row.id ?? ''),
      productId: String(row.product_id ?? ''),
      productName: String(row.product_name || 'Product'),
      status: ['submitted', 'under_review', 'approved', 'paid', 'rejected'].includes(status)
        ? status
        : 'submitted',
      createdOn: String(row.created_on || row.updated_on || ''),
      price: Number(row.product_price) || 0,
    };
  }

  private toRefund(row: any): RefundRecord {
    return {
      id: String(row.id ?? ''),
      createdOn: String(row.created_on || row.updated_on || ''),
      expected: Number(row.expected_price) || 0,
    };
  }

  private toProduct(row: any): ProductRecord {
    return {
      id: String(row.id ?? row.product_id ?? ''),
      name: String(row.name || 'Product'),
      brand: String(row.brand_name || ''),
      status: Number(row.status || 0),
    };
  }

  private inPeriod(value: string): boolean {
    if (this.period === 'all') {
      return true;
    }
    const date = this.parseDate(value);
    if (!date) {
      return false;
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - Number(this.period));
    return date.getTime() >= start.getTime();
  }

  private inRange(value: string, range: { start: number; end: number }): boolean {
    const date = this.parseDate(value);
    if (!date) {
      return false;
    }
    const time = date.getTime();
    return time >= range.start && time < range.end;
  }

  private bucketRanges(): { label: string; start: number; end: number }[] {
    const now = new Date();
    const monthly = this.period === '365' || this.period === 'all';
    const count = this.period === '30' ? 5 : this.period === '90' ? 6 : 12;
    const stepDays = this.period === '30' ? 6 : 15;

    return Array.from({ length: count }, (_, index) => {
      if (monthly) {
        const start = new Date(now.getFullYear(), now.getMonth() - (count - index - 1), 1);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
        return {
          label: start.toLocaleDateString('en-GB', { month: 'short' }),
          start: start.getTime(),
          end: end.getTime(),
        };
      }
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      end.setDate(end.getDate() - (count - index - 1) * stepDays);
      const start = new Date(end);
      start.setDate(start.getDate() - stepDays);
      return {
        label: start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        start: start.getTime(),
        end: end.getTime(),
      };
    });
  }

  private parseDate(value: string): Date | null {
    if (!value) {
      return null;
    }
    const date = new Date(String(value).replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatCount(value: number): string {
    return value.toLocaleString('en-IN');
  }
}
