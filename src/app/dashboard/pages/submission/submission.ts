import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  ENTITY_TYPE_IDS,
  getTokenFromLocalStorage,
  STORAGE_KEYS,
} from '../../../../constants/app.constants';
import { Apiservice } from '../../../../services/apiservice';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import {
  buildPageNumbers,
  getPaginationRedirectPage,
  PaginatedListView,
  PaginatedPageMeta,
  parsePaginatedResponse,
  showingFrom,
  showingTo,
} from '../products/products-pagination.model';

@Component({
  selector: 'app-submission',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './submission.html',
  styleUrl: './submission.css',
})
export class Submission implements OnInit {
  token: any =
    getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.token || null;
  promote_id: any = '';
  submissions: any[] = [];
  isRefundSubmission = false;
  loading = true;
  loadError = '';
  role: number | null = null;

  currentPage = 1;
  lastPage = 1;
  totalSubmissions = 0;
  perPage = 0;

  private expandedRows = new Set<string | number>();

  ENTITY_TYPE_IDS = ENTITY_TYPE_IDS;

  constructor(
    private apiService: Apiservice,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const storedRole = getTokenFromLocalStorage(STORAGE_KEYS.CURRENT_ROLE);
    this.role =
      storedRole != null && storedRole !== ''
        ? Number(storedRole)
        : null;

    this.route.params.subscribe((params) => {
      this.promote_id = params['id'];
      this.isRefundSubmission =
        this.route.snapshot.routeConfig?.path === 'refund/submission/:id';

      if (!this.promote_id) {
        this.loading = false;
        this.loadError = 'Product not found.';
        this.cdr.detectChanges();
        return;
      }

      if (!this.token) {
        this.loading = false;
        this.loadError = 'Please log in to view submissions.';
        this.cdr.detectChanges();
        return;
      }

      this.currentPage = 1;
      this.loadSubmissions(1);
    });
  }

  get pageTitle(): string {
    return this.isRefundSubmission ? 'Refund Submissions' : 'Form Submissions';
  }

  get showActionsColumn(): boolean {
    return !this.isRefundSubmission;
  }

  get isUserRole(): boolean {
    return this.role === ENTITY_TYPE_IDS.USER;
  }

  get submissionPaginator(): PaginatedListView {
    return {
      loading: this.loading,
      total: this.totalSubmissions,
      currentPage: this.currentPage,
      lastPage: this.lastPage,
      perPage: this.perPage,
      pageNumbers: buildPageNumbers(this.currentPage, this.lastPage),
      showingFrom: showingFrom(
        this.totalSubmissions,
        this.currentPage,
        this.perPage
      ),
      showingTo: showingTo(
        this.totalSubmissions,
        this.currentPage,
        this.perPage,
        this.submissions.length
      ),
      itemLabel: 'submissions',
      goToPage: (page) => this.goToPage(page),
    };
  }

  canRequestRefund(s: { refund_submission_count?: unknown }): boolean {
    return this.isUserRole && this.refundCount(s) === 0;
  }

  canViewRefund(s: { refund_submission_count?: unknown }): boolean {
    return this.refundCount(s) > 0;
  }

  private refundCount(s: { refund_submission_count?: unknown }): number {
    const n = Number(s.refund_submission_count);
    return Number.isFinite(n) ? n : 0;
  }

  goBackToProducts(): void {
    this.router.navigate(['/products']);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage || page === this.currentPage) {
      return;
    }
    this.loadSubmissions(page);
  }

  rowNumber(index: number): number {
    if (!this.perPage) {
      return index + 1;
    }
    return (this.currentPage - 1) * this.perPage + index + 1;
  }

  getRowKey(s: { id?: string | number }, index: number): string | number {
    return s.id ?? index;
  }

  isExpanded(s: { id?: string | number }, index: number): boolean {
    return this.expandedRows.has(this.getRowKey(s, index));
  }

  toggleExpanded(s: { id?: string | number }, index: number): void {
    const key = this.getRowKey(s, index);
    if (this.expandedRows.has(key)) {
      this.expandedRows.delete(key);
    } else {
      this.expandedRows.add(key);
    }
  }

  getFieldCount(s: { submission?: Record<string, unknown> }): number {
    const sub = s.submission;
    return sub && typeof sub === 'object' ? Object.keys(sub).length : 0;
  }

  private loadSubmissions(page: number = this.currentPage): void {
    this.loading = true;
    this.loadError = '';

    const perPage = this.perPage || undefined;
    let api$: Observable<unknown>;

    if (this.role === ENTITY_TYPE_IDS.USER) {
      api$ = this.isRefundSubmission
        ? this.apiService.getUserFromRefundSubmission(
            this.token,
            this.promote_id,
            page,
            perPage
          )
        : this.apiService.getUserFromSubmission(
            this.token,
            this.promote_id,
            page,
            perPage
          );
    } else if (this.role === ENTITY_TYPE_IDS.MEDIATOR) {
      api$ = this.isRefundSubmission
        ? this.apiService.getCompanyAndMediatorFromRefundSubmission(
            this.token,
            this.promote_id,
            page,
            perPage
          )
        : this.apiService.getMediatorFromSubmission(
            this.token,
            this.promote_id,
            page,
            perPage
          );
    } else {
      api$ = this.isRefundSubmission
        ? this.apiService.getCompanyAndMediatorFromRefundSubmission(
            this.token,
            this.promote_id,
            page,
            perPage
          )
        : this.apiService.getFormSubmissions(
            this.token,
            this.promote_id,
            page,
            perPage
          );
    }

    api$.subscribe({
      next: (res: any) => {
        const parsed = parsePaginatedResponse(res, page);
        const redirect = getPaginationRedirectPage(parsed, page);
        if (redirect !== null) {
          this.loadSubmissions(redirect);
          return;
        }
        this.applySubmissionPage(parsed);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => this.handleLoadError(err),
    });
  }

  private applySubmissionPage(parsed: PaginatedPageMeta): void {
    this.expandedRows.clear();

    const data = parsed.items;
    for (let i = 0; i < data.length; i++) {
      if (typeof data[i].submission === 'string') {
        try {
          data[i].submission = JSON.parse(data[i].submission);
        } catch {
          data[i].submission = {};
        }
      }
      if (!data[i].submission || typeof data[i].submission !== 'object') {
        data[i].submission = {};
      }
    }

    this.submissions = data;
    this.currentPage = parsed.currentPage;
    this.lastPage = parsed.lastPage;
    this.totalSubmissions = parsed.total;
    this.perPage = parsed.perPage;

    if (this.submissions.length > 0) {
      this.expandedRows.add(this.getRowKey(this.submissions[0], 0));
    }
  }

  private handleLoadError(error: any): void {
    console.error(error);
    this.submissions = [];
    this.loadError =
      error?.error?.message ||
      error?.message ||
      'Failed to load submissions.';
    this.loading = false;
    this.cdr.detectChanges();
  }

  formatValue(value: any): string {
    if (value == null || value === '') {
      return '—';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  }

  refundSubmission(s: any): void {
    this.router.navigate(['/refundform', s.id]);
  }

  viewRefundSubmission(s: any): void {
    this.router.navigate(['/refund/submission', s.id]);
  }
}
