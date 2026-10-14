import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Apiservice } from '../../../../services/apiservice';
import { getTokenFromLocalStorage, STORAGE_KEYS } from '../../../../constants';
import { parsePaginatedResponse } from '../products/products-pagination.model';
import { ensureMemberRole } from './member-role';

interface MemberSubmission {
  id: string;
  product: string;
  company: string;
  when: string;
  status: string;
  statusKey: string;
}

@Component({
  selector: 'app-member-submissions',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './member-submissions.html',
  styleUrl: './member.css',
})
export class MemberSubmissions implements OnInit {
  rows: MemberSubmission[] = [];
  query = '';
  status = 'all';
  product = 'all';
  loading = false;
  error = '';
  page = 1;
  lastPage = 1;

  readonly statusOptions = [
    { key: 'draft', label: 'Draft' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Under review' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'paid', label: 'Refund paid' },
  ];
  readonly steps = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Under review' },
    { key: 'approved', label: 'Approved' },
    { key: 'paid', label: 'Refund paid' },
  ];

  private token: string | null = null;

  constructor(
    private router: Router,
    private api: Apiservice,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (!ensureMemberRole(this.router)) {
      return;
    }
    this.token = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.token ?? null;
    this.load(1);
  }

  get productOptions(): string[] {
    return [...new Set(this.rows.map((row) => row.product).filter(Boolean))];
  }

  get tracked(): MemberSubmission[] {
    return this.rows.filter((row) => this.product === 'all' || row.product === this.product);
  }

  get visible(): MemberSubmission[] {
    const query = this.query.trim().toLowerCase();
    return this.tracked.filter((row) => {
      const statusOk = this.status === 'all' || row.statusKey === this.status;
      const text = `${row.id} ${row.product} ${row.company} ${row.status}`.toLowerCase();
      return statusOk && (!query || text.includes(query));
    });
  }

  countFor(key: string): number {
    return this.tracked.filter((row) => row.statusKey === key).length;
  }

  toggleStatus(key: string): void {
    this.status = this.status === key ? 'all' : key;
  }

  progress(row: MemberSubmission): number {
    if (row.statusKey === 'paid') return 4;
    if (row.statusKey === 'approved') return 3;
    if (row.statusKey === 'under_review') return 2;
    if (row.statusKey === 'submitted') return 1;
    return 0;
  }

  needsAction(row: MemberSubmission): boolean {
    return row.statusKey === 'draft' || row.statusKey === 'rejected';
  }

  statusLabel(row: MemberSubmission): string {
    return this.statusOptions.find((item) => item.key === row.statusKey)?.label ?? row.status;
  }

  load(page: number): void {
    this.loading = true;
    this.error = '';
    this.api.getUserOrderHistory(this.token, page, 20).subscribe({
      next: (res: unknown) => {
        const parsed = parsePaginatedResponse(res, page);
        this.rows = parsed.items.map((item) => this.mapRow(item as Record<string, unknown>));
        this.page = parsed.currentPage;
        this.lastPage = parsed.lastPage;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.rows = [];
        this.loading = false;
        this.error = 'Submissions could not be loaded.';
        this.cdr.detectChanges();
      },
    });
  }

  private mapRow(raw: Record<string, unknown>): MemberSubmission {
    const record = (raw['submission'] as Record<string, unknown>) || raw;
    const product = (raw['product'] as Record<string, unknown>) || record;
    const status = this.text(
      record['status_label'] ?? record['status'] ?? raw['status_label'] ?? raw['status'],
      'Submitted',
    );
    return {
      id: String(record['id'] ?? raw['id'] ?? record['submission_id'] ?? ''),
      product: this.text(
        product['name'] ?? product['product_name'] ?? record['product_name'] ?? raw['product_name'],
        'Submission',
      ),
      company: this.text(
        record['company_name'] ?? raw['company_name'] ?? product['company_name'],
        'Company',
      ),
      when: this.formatWhen(
        record['created_at'] ?? record['submitted_at'] ?? raw['created_at'] ?? raw['updated_at'],
      ),
      status: status.replaceAll('_', ' '),
      statusKey: this.statusKey(status),
    };
  }

  private statusKey(status: string): string {
    const key = status.toLowerCase();
    if (key.includes('draft')) return 'draft';
    if (key.includes('paid')) return 'paid';
    if (key.includes('reject')) return 'rejected';
    if (key.includes('approv')) return 'approved';
    if (key.includes('review') || key.includes('pending')) return 'under_review';
    if (key.includes('submit')) return 'submitted';
    return 'other';
  }

  private text(value: unknown, fallback: string): string {
    if (value == null || value === '' || typeof value === 'object') {
      return fallback;
    }
    return String(value);
  }

  private formatWhen(value: unknown): string {
    if (value == null || value === '' || typeof value === 'object') {
      return '';
    }
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
