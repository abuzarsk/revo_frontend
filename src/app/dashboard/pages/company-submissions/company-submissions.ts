import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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

type SubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';

interface SubmissionRow {
  id: string | number;
  product_id: string | number;
  promote_id?: string | number;
  product_name: string;
  company_name: string;
  revo_user_name: string;
  status: SubmissionStatus;
  created_on: string;
  updated_on: string;
  submission?: unknown;
  form_json?: unknown;
  refund_submission_id?: string | number | null;
  refund_submission?: unknown;
  refund_form_json?: unknown;
  refund_accept_reject_remark?: string;
  refund_screenshot?: string;
  refund_accept_reject_screenshot?: string;
  product_price?: number | null;
  less?: number | null;
  expected_price?: number | null;
}

interface DetailField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  value: string;
  checked: boolean;
}

interface HistoryEvent {
  status: SubmissionStatus;
  at: string;
  note: string;
  remark?: string;
}

interface SubmissionProduct {
  id: string | number;
  name: string;
}

@Component({
  selector: 'app-company-submissions',
  imports: [CommonModule, FormsModule],
  templateUrl: './company-submissions.html',
  styleUrls: ['../company-portal/company-portal.css'],
})
export class CompanySubmissions implements OnInit, OnDestroy {
  query = '';
  statusFilter: 'all' | 'action' | SubmissionStatus = 'all';
  productFilter = 'all';

  loading = true;
  loadError = '';
  rows: SubmissionRow[] = [];
  products: SubmissionProduct[] = [];
  counts: Record<SubmissionStatus, number> = {
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
  };

  page = 1;
  lastPage = 1;
  total = 0;
  perPage = 10;
  selected: SubmissionRow | null = null;
  pendingAction: 'accept' | 'reject' | null = null;
  reviewRemark = '';
  reviewImageFile: File | null = null;
  reviewImagePreview: string | null = null;
  reviewSubmitting = false;
  feedback = '';

  readonly statuses: { key: SubmissionStatus; label: string; badge: string }[] = [
    { key: 'submitted', label: 'Submitted', badge: 'cp-badge--submitted' },
    { key: 'under_review', label: 'Under review', badge: 'cp-badge--review' },
    { key: 'approved', label: 'Approved', badge: 'cp-badge--approved' },
    { key: 'rejected', label: 'Rejected', badge: 'cp-badge--rejected' },
    { key: 'paid', label: 'Refund paid', badge: 'cp-badge--paid' },
  ];

  private token =
    getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.token || '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private api: Apiservice,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    const role = Number(getTokenFromLocalStorage(STORAGE_KEYS.CURRENT_ROLE));
    if (role !== ENTITY_TYPE_IDS.COMPANY) {
      this.router.navigate(['/']);
      return;
    }
    this.load(1);
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.clearReviewImage();
  }

  get showingFrom(): number {
    if (!this.total) {
      return 0;
    }
    return (this.page - 1) * this.perPage + 1;
  }

  get showingTo(): number {
    return Math.min(this.page * this.perPage, this.total);
  }

  countFor(key: SubmissionStatus): number {
    return this.counts[key] ?? 0;
  }

  badgeFor(status: string): string {
    return this.statuses.find((item) => item.key === status)?.badge ?? '';
  }

  labelFor(status: string): string {
    return this.statuses.find((item) => item.key === status)?.label ?? status;
  }

  needsAction(row: SubmissionRow): boolean {
    return row.status === 'under_review';
  }

  isViewOnly(row: SubmissionRow): boolean {
    const status = String(row.status || '').toLowerCase();
    return status === 'paid' || status === 'refunded';
  }

  hasReview(row: SubmissionRow): boolean {
    return row.refund_submission_id != null && String(row.refund_submission_id) !== '' && String(row.refund_submission_id) !== '0';
  }

  openRow(row: SubmissionRow): void {
    this.selected = row;
    this.pendingAction = null;
    this.reviewRemark = '';
    this.feedback = '';
  }

  closeDetail(): void {
    this.selected = null;
    this.pendingAction = null;
    this.reviewRemark = '';
    this.feedback = '';
  }

  fieldsFor(row: SubmissionRow): DetailField[] {
    return this.detailFields(row.submission, row.form_json);
  }

  reviewFieldsFor(row: SubmissionRow): DetailField[] {
    return this.detailFields(row.refund_submission, row.refund_form_json);
  }

  private detailFields(submission: unknown, formJson: unknown): DetailField[] {
    const answers = this.parseObject(submission);
    const elements = this.parseElements(formJson);
    if (elements.length) {
      return elements
        .filter((element) => !['heading', 'divider', 'button'].includes(element.type))
        .map((element) => {
          const answer = answers[element.id];
          const value = this.answerValue(answer);
          return {
            id: element.id,
            type: element.type,
            label: element.label || this.answerLabel(answer) || element.id,
            required: !!element.required,
            value,
            checked: value === 'true' || value === '1' || value === 'yes',
          };
        });
    }
    return Object.entries(answers).map(([id, answer]) => {
      const value = this.answerValue(answer);
      return {
        id,
        type: 'text',
        label: this.answerLabel(answer) || id,
        required: false,
        value,
        checked: false,
      };
    });
  }

  historyFor(row: SubmissionRow): HistoryEvent[] {
    const events: HistoryEvent[] = [];
    if (row.status === 'paid') {
      events.push({
        status: 'paid',
        at: row.updated_on || row.created_on,
        note: 'Under review → Refund paid by Company',
        remark: row.refund_accept_reject_remark || undefined,
      });
    } else if (row.status === 'rejected') {
      events.push({
        status: 'rejected',
        at: row.updated_on || row.created_on,
        note: 'Under review → Rejected by Company',
        remark: row.refund_accept_reject_remark || undefined,
      });
    } else if (row.status === 'under_review') {
      events.push({
        status: 'under_review',
        at: row.updated_on || row.created_on,
        note: 'Submitted → Under review by Company',
      });
    }
    events.push({
      status: 'submitted',
      at: row.created_on,
      note: 'Created by Member',
    });
    return events;
  }

  beginReview(action: 'accept' | 'reject'): void {
    this.pendingAction = action;
    this.reviewRemark = '';
    this.clearReviewImage();
    this.feedback = '';
  }

  cancelReview(): void {
    if (this.reviewSubmitting) {
      return;
    }
    this.pendingAction = null;
    this.reviewRemark = '';
    this.clearReviewImage();
  }

  onReviewImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.clearReviewImage();
    this.reviewImageFile = file;
    this.reviewImagePreview = file ? URL.createObjectURL(file) : null;
  }

  screenshotUrl(row: SubmissionRow): string | null {
    const screenshot = row.refund_screenshot || row.refund_accept_reject_screenshot;
    if (screenshot == null || screenshot === '') {
      return null;
    }
    const path = String(screenshot);
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const base = environment.imageBaseUrl.endsWith('/')
      ? environment.imageBaseUrl
      : `${environment.imageBaseUrl}/`;
    if (path.startsWith('uploads/')) {
      return base.replace(/uploads\/?$/, '') + path;
    }
    return `${base}${IMAGE_FOLDERS.REFUNDS}/${path}`;
  }

  submitReview(): void {
    const row = this.selected;
    if (!row || !this.pendingAction || !this.token) {
      return;
    }
    const remark = this.reviewRemark.trim();
    if (!remark) {
      this.feedback = 'Please add a reason.';
      return;
    }
    if (this.pendingAction === 'accept' && !this.reviewImageFile) {
      this.feedback = 'Please add a screenshot.';
      return;
    }
    const refundId = row.refund_submission_id;
    if (refundId == null || refundId === '') {
      this.feedback = 'Refund submission not found.';
      return;
    }

    const payload = new FormData();
    payload.append('id', String(row.id));
    payload.append('form_submission_id', String(row.id));
    payload.append('remark', remark);
    payload.append('status', this.pendingAction === 'accept' ? '1' : '2');
    if (this.pendingAction === 'accept' && this.reviewImageFile) {
      payload.append('image', this.reviewImageFile);
    }

    this.reviewSubmitting = true;
    const request =
      this.pendingAction === 'accept'
        ? this.api.acceptRefundSubmission(this.token, payload)
        : this.api.rejectRefundSubmission(this.token, payload);

    request.subscribe({
      next: () => {
        this.feedback =
          this.pendingAction === 'accept' ? 'Refund marked paid.' : 'Refund rejected.';
        this.pendingAction = null;
        this.reviewRemark = '';
        this.clearReviewImage();
        this.reviewSubmitting = false;
        this.load(this.page, row.id);
      },
      error: (error: { error?: { message?: string }; message?: string }) => {
        this.reviewSubmitting = false;
        this.feedback =
          error?.error?.message || error?.message || 'Could not update this submission.';
        this.cdr.detectChanges();
      },
    });
  }

  setStatus(key: 'all' | 'action' | SubmissionStatus): void {
    this.statusFilter = this.statusFilter === key ? 'all' : key;
    this.load(1);
  }

  onProductChange(): void {
    this.load(1);
  }

  onSearchChange(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.load(1), 300);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage || page === this.page || this.loading) {
      return;
    }
    this.load(page);
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

  formatWhen(value: string): string {
    if (!value) {
      return '—';
    }
    const date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private load(page: number, keepId: string | number | null = this.selected?.id ?? null): void {
    if (!this.token) {
      this.loading = false;
      this.loadError = 'Please log in to view submissions.';
      this.rows = [];
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.loadError = '';
    this.api
      .getCompanySubmissions(this.token, page, this.perPage, {
        product_id: this.productFilter,
        status: this.statusFilter,
        q: this.query.trim(),
      })
      .subscribe({
        next: (res: any) => {
          const payload = res?.data ?? {};
          const items = Array.isArray(payload.data) ? payload.data : [];
          this.rows = items;
          this.products = Array.isArray(payload.products) ? payload.products : [];
          const counts = payload.counts ?? {};
          this.counts = {
            submitted: Number(counts.submitted ?? 0),
            under_review: Number(counts.under_review ?? 0),
            approved: Number(counts.approved ?? 0),
            rejected: Number(counts.rejected ?? 0),
            paid: Number(counts.paid ?? 0),
          };
          const pagination = payload.pagination ?? {};
          this.page = Number(pagination.page ?? page);
          this.perPage = Number(pagination.per_page ?? this.perPage);
          this.total = Number(pagination.total ?? items.length);
          this.lastPage = Math.max(1, Number(pagination.total_pages ?? 1));
          if (keepId != null) {
            this.selected =
              this.rows.find((row) => String(row.id) === String(keepId)) ?? this.selected;
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: { error?: { message?: string }; message?: string }) => {
          this.rows = [];
          this.loading = false;
          this.loadError =
            error?.error?.message ||
            error?.message ||
            'Failed to load submissions.';
          this.cdr.detectChanges();
        },
      });
  }

  private clearReviewImage(): void {
    if (this.reviewImagePreview) {
      URL.revokeObjectURL(this.reviewImagePreview);
    }
    this.reviewImageFile = null;
    this.reviewImagePreview = null;
  }

  private parseObject(value: unknown): Record<string, unknown> {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : {};
      } catch {
        return {};
      }
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private parseElements(value: unknown): { id: string; type: string; label: string; required: boolean }[] {
    let parsed: unknown = value;
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch {
        return [];
      }
    }
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const element = item as Record<string, unknown>;
        return {
          id: String(element['id'] ?? ''),
          type: String(element['type'] ?? 'text'),
          label: String(element['label'] ?? ''),
          required: element['required'] === true,
        };
      })
      .filter((element) => element.id);
  }

  private answerValue(answer: unknown): string {
    if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
      const value = (answer as Record<string, unknown>)['value'];
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return value == null ? '' : String(value);
    }
    return answer == null ? '' : String(answer);
  }

  private answerLabel(answer: unknown): string {
    if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
      return String((answer as Record<string, unknown>)['label'] ?? '');
    }
    return '';
  }
}
