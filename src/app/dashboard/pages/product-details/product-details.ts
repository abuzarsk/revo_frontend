import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import {
  ENTITY_TYPE_IDS,
  getTokenFromLocalStorage,
  STORAGE_KEYS,
  IMAGE_FOLDERS,
} from '../../../../constants/app.constants';
import { Apiservice } from '../../../../services/apiservice';
import { environment } from '../../../../environments/environment';
import {
  buildPageNumbers,
  getPaginationRedirectPage,
  PaginatedListView,
  PaginatedPageMeta,
  parsePaginatedResponse,
  showingFrom,
  showingTo,
} from '../products/products-pagination.model';

export interface SubmissionFieldColumn {
  key: string;
  label: string;
  source: 'submission' | 'refund_submission_text';
}
@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit, OnDestroy {
  token: any =
    getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.token || null;
  role: number | null = null;
  productId = '';
  //promoteId = '';
  product: any = null;
  loading = true;
  error = '';

  submissions: any[] = [];
  formFieldColumns: SubmissionFieldColumn[] = [];
  refundFieldColumns: SubmissionFieldColumn[] = [];
  submissionsLoading = false;
  submissionsError = '';
  excelDownloading = false;
  submissionCurrentPage = 1;
  submissionLastPage = 1;
  submissionTotal = 0;
  submissionPerPage = 0;
  promotionUpdating = false;
  refundReviewUpdatingId: string | number | null = null;
  showRefundReviewOverlay = false;
  refundReviewAction: 'accept' | 'reject' | null = null;
  refundReviewTarget: {
    id?: string | number;
    refund_submission_id?: string | number;
  } | null = null;
  refundReviewRemark = '';
  refundReviewImageFile: File | null = null;
  refundReviewImagePreview: string | null = null;
  refundReviewSubmitting = false;
  promotedStatus = '';

  promoteId = '';
  readonly imageBaseUrl = environment.imageBaseUrl;
  ENTITY_TYPE_IDS = ENTITY_TYPE_IDS;
  copyToastVisible = false;
  copyToastMessage = '';
  copyToastSuccess = true;
  formLinkCopied = false;
  private copyToastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private apiService: Apiservice,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const storedRole = getTokenFromLocalStorage(STORAGE_KEYS.CURRENT_ROLE);
    this.role =
      storedRole != null && storedRole !== ''
        ? Number(storedRole)
        : null;

    this.route.params.subscribe((params) => {
      this.productId = params['id'];
      
      if(this.role==ENTITY_TYPE_IDS.USER){
        this.promoteId = params['promote_id'];
      }
      // if(this.promotedStatus == 'promoted'){
      //   this.promoteId = params['promote_id'];
      // }else{
      //   this.promoteId = this.productId;
      // }
      if (!this.productId) {
        this.loading = false;
        this.error = 'Product not found.';
        this.cdr.detectChanges();
        return;
      }
      if (!this.token) {
        this.loading = false;
        this.error = 'Please log in to view product details.';
        this.cdr.detectChanges();
        return;
      }

      this.loadProduct();

    //   if(this.isCompany || this.isMediator){
    //   //this.apiService.getPromoteIdFromProduct(this.token,this.productId).subscribe((res: any) => {
    //    // console.log(res);
    //     if(this.promotedStatus == 'unpromoted'){
    //       this.promoteId = '-1';
    //       this.promoteId = this.productId;
    //     }
    //     //this.promoteId = res.data.promote_id;
    //     this.loadProduct();

    //  // });
    //   }else{
    //     this.promoteId = this.productId;
    //     this.loadProduct();
    //   }
    });
  }

  ngOnDestroy(): void {
    if (this.copyToastTimer) {
      clearTimeout(this.copyToastTimer);
    }
  }

  get isCompany(): boolean {
    return this.role === ENTITY_TYPE_IDS.COMPANY;
  }

  get isMediator(): boolean {
    return this.role === ENTITY_TYPE_IDS.MEDIATOR;
  }

  get isUser(): boolean {
    return this.role === ENTITY_TYPE_IDS.USER;
  }

  /** Excel download is available for roles 1–3 (admin, company, mediator). */
  get showExcelDownload(): boolean {
    return this.role != null && this.role <= ENTITY_TYPE_IDS.MEDIATOR;
  }

  get submissionPaginator(): PaginatedListView {
    return {
      loading: this.submissionsLoading,
      total: this.submissionTotal,
      currentPage: this.submissionCurrentPage,
      lastPage: this.submissionLastPage,
      perPage: this.submissionPerPage,
      pageNumbers: buildPageNumbers(
        this.submissionCurrentPage,
        this.submissionLastPage
      ),
      showingFrom: showingFrom(
        this.submissionTotal,
        this.submissionCurrentPage,
        this.submissionPerPage
      ),
      showingTo: showingTo(
        this.submissionTotal,
        this.submissionCurrentPage,
        this.submissionPerPage,
        this.submissions.length
      ),
      itemLabel: 'submissions',
      goToPage: (page) => this.goToSubmissionPage(page),
    };
  }

  get photoUrl(): string | null {
    if (!this.product?.photo) {
      return null;
    }
    return this.imageBaseUrl + 'products/' + this.product.photo;
  }

  get promotionLabel(): string {
    const status = this.promoteStatus;
    if (status === 1) {
      return 'Promoted';
    }
    if (status === 2) {
      return 'Demoted';
    }
    return 'Not promoted';
  }

  get promoteStatus(): number {
    const raw = this.product?.promote_status ?? 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  get showPromoteButton(): boolean {
    return this.promoteStatus === 0;
  }

  get showDemoteButton(): boolean {
    return this.promoteStatus === 1;
  }

  companyPromotionLabel(status: number): string {
    if (status === 1) {
      return 'Promoted';
    }
    if (status === 2) {
      return 'Demoted';
    }
    return 'Not promoted';
  }

  get formStatusLabel(): string {
    const status = this.product?.form_status;
    if (status === 1 || status === '1') return 'Published';
    if (status === 0 || status === '0') return 'Draft';
    return status != null ? String(status) : '—';
  }

  get refundFormStatusLabel(): string {
    const status = this.product?.refund_form_status;
    if (status === 1 || status === '1') return 'Published';
    if (status === 0 || status === '0') return 'Draft';
    return status != null ? String(status) : '—';
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  goToSubmissionPage(page: number): void {
    if (
      page < 1 ||
      page > this.submissionLastPage ||
      page === this.submissionCurrentPage
    ) {
      return;
    }
    this.loadSubmissions(page);
  }

  submissionRowNumber(index: number): number {
    if (!this.submissionPerPage) {
      return index + 1;
    }
    return (this.submissionCurrentPage - 1) * this.submissionPerPage + index + 1;
  }

  getSubmissionColumnValue(
    submission: Record<string, unknown>,
    col: SubmissionFieldColumn
  ): string {
    const payload =
      col.source === 'refund_submission_text'
        ? submission['refund_submission_text']
        : submission['submission'];
    const data = this.parseSubmissionPayload(payload);
    const field = data[col.key];
    if (field == null) {
      return '—';
    }
    if (typeof field === 'object' && field !== null && 'value' in field) {
      return this.formatValue((field as { value: unknown }).value);
    }
    return this.formatValue(field);
  }

  formatValue(value: unknown): string {
    if (value == null || value === '') {
      return '—';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  }

  canRequestRefund(s: { refund_submission_count?: unknown }): boolean {
    return this.isUser && this.refundCount(s) === 0;
  }

  canViewRefund(s: { refund_submission_count?: unknown }): boolean {
    return this.refundCount(s) > 0;
  }

  refundSubmission(s: { id?: string | number }): void {
    if (!s.id) {
      return;
    }
    this.router.navigate(['/refundform', s.id]);
  }

  viewRefundSubmission(s: { id?: string | number }): void {
    if (!s.id) {
      return;
    }
    this.router.navigate(['/refund/submission', s.id]);
  }

  private refundCount(s: { refund_submission_count?: unknown }): number {
    const n = Number(s.refund_submission_count);
    return Number.isFinite(n) ? n : 0;
  }

  getRefundSubmissionCount(s: { refund_submission_count?: unknown }): number {
    return this.refundCount(s);
  }

  get showRefundReviewColumn(): boolean {
    return this.isCompany || this.isMediator;
  }

  getRefundAcceptStatus(s: {
    refund_accept_status?: unknown;
  }): number | null {
    const n = Number(s.refund_accept_status);
    if (!Number.isFinite(n)) {
      return null;
    }
    return n;
  }

  isRefundAccepted(s: { refund_accept_status?: unknown }): boolean {
    return this.getRefundAcceptStatus(s) === 1;
  }

  isRefundRejected(s: { refund_accept_status?: unknown }): boolean {
    return this.getRefundAcceptStatus(s) === 2;
  }
 
  isRefundPending(s: { refund_accept_status?: unknown, refund_submission_count?: unknown }): boolean {
    return this.getRefundAcceptStatus(s) === 0 && s.refund_submission_count == 1;
  }


  getRefundAcceptStatusLabel(s: {
    refund_accept_status?: unknown;
  }): string {
    const status = this.getRefundAcceptStatus(s);
    if (status === 1) {
      return 'Accepted';
    }
    if (status === 2) {
      return 'Rejected';
    }
    return status != null ? String(status) : '—';
  }

  getRefundAcceptRejectRemark(s: {
    refund_accept_reject_remark?: unknown;
  }): string {
    const remark = s.refund_accept_reject_remark;
    if (remark == null || remark === '') {
      return '—';
    }
    return String(remark);
  }

  getRefundAcceptRejectScreenshotUrl(s: {
    refund_accept_reject_screenshot?: unknown;
  }): string | null {
    const screenshot = s.refund_accept_reject_screenshot;
    if (screenshot == null || screenshot === '') {
      return null;
    }
    const path = String(screenshot);
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const base = this.imageBaseUrl.endsWith('/')
      ? this.imageBaseUrl
      : `${this.imageBaseUrl}/`;
    if (path.startsWith('uploads/')) {
      return base.replace(/uploads\/?$/, '') + path;
    }
    return `${base}${IMAGE_FOLDERS.REFUNDS}/${path}`;
  }

  canReviewRefund(s: {
    refund_submission_count?: unknown;
    refund_accept_status?: unknown;
  }): boolean {
    if (!this.showRefundReviewColumn || this.getRefundSubmissionCount(s) !== 1) {
      return false;
    }
    const status = this.getRefundAcceptStatus(s);
    return status !== 1 && status !== 2;
  }

  isRefundReviewUpdating(s: { id?: string | number }): boolean {
    return (
      this.refundReviewSubmitting &&
      this.refundReviewUpdatingId != null &&
      this.refundReviewUpdatingId === s.id
    );
  }

  get refundReviewOverlayTitle(): string {
    return this.refundReviewAction === 'accept'
      ? 'Accept Refund'
      : 'Reject Refund';
  }

  acceptRefund(s: {
    id?: string | number;
    refund_submission_id?: string | number;
  }): void {
    this.openRefundReviewOverlay(s, 'accept');
  }

  rejectRefund(s: {
    id?: string | number;
    refund_submission_id?: string | number;
  }): void {
    this.openRefundReviewOverlay(s, 'reject');
  }

  openRefundReviewOverlay(
    s: { id?: string | number; refund_submission_id?: string | number },
    action: 'accept' | 'reject'
  ): void {
    this.refundReviewTarget = s;
    this.refundReviewAction = action;
    this.refundReviewRemark = '';
    this.refundReviewImageFile = null;
    this.refundReviewImagePreview = null;
    this.showRefundReviewOverlay = true;
  }

  closeRefundReviewOverlay(): void {
    if (this.refundReviewSubmitting) {
      return;
    }
    this.showRefundReviewOverlay = false;
    this.refundReviewAction = null;
    this.refundReviewTarget = null;
    this.refundReviewRemark = '';
    this.refundReviewImageFile = null;
    this.refundReviewImagePreview = null;
  }

  onRefundReviewImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.refundReviewImageFile = file;
    this.refundReviewImagePreview = file ? URL.createObjectURL(file) : null;
  }

  submitRefundReview(): void {
    if (!this.refundReviewTarget || !this.refundReviewAction) {
      return;
    }

    const remark = this.refundReviewRemark.trim();
    if (!remark) {
      alert('Please enter a remark.');
      return;
    }

    this.reviewRefund(
      this.refundReviewTarget,
      this.refundReviewAction,
      remark,
      this.refundReviewImageFile
    );
  }

  private reviewRefund(
    s: { id?: string | number; refund_submission_id?: string | number },
    action: 'accept' | 'reject',
    remark: string,
    imageFile: File | null = null
  ): void {
    const submissionId = s.refund_submission_id ?? s.id;
    if (!submissionId) {
      alert('Refund submission not found.');
      return;
    }

    const payload = new FormData();
    payload.append('id', String(submissionId));
    if (s.id != null) {
      payload.append('form_submission_id', String(s.id));
    }
    payload.append('remark', remark);
    if (action === 'accept' && imageFile) {
      payload.append('image', imageFile);
      payload.append('status', '1');
    }else if(action === 'reject'){
      payload.append('status', '2');
    }

    

    this.refundReviewUpdatingId = s.id ?? submissionId;
    this.refundReviewSubmitting = true;
    const api$ =
      action === 'accept'
        ? this.isMediator
          ? this.apiService.acceptRefundSubmissionMediator(this.token, payload)
          : this.apiService.acceptRefundSubmission(this.token, payload)
        : this.isMediator
          ? this.apiService.rejectRefundSubmissionMediator(this.token, payload)
          : this.apiService.rejectRefundSubmission(this.token, payload);

    api$.subscribe({
      next: () => {
        this.refundReviewUpdatingId = null;
        this.refundReviewSubmitting = false;
        this.closeRefundReviewOverlay();
        this.loadSubmissions(this.submissionCurrentPage);
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        console.error(error);
        this.refundReviewUpdatingId = null;
        this.refundReviewSubmitting = false;
        const err = error as { error?: { message?: string }; message?: string };
        alert(
          err?.error?.message ||
            err?.message ||
            `Failed to ${action} refund.`
        );
        this.cdr.detectChanges();
      },
    });
  }

  // private get promoteId(): string | number | null {
  //   return this.product?.promote_id ?? this.productId ?? null;
  // }

  private loadProduct(): void {
    this.loading = true;
    this.error = '';

    var api$:any = null;
    if(this.isMediator){
      api$ = this.apiService.getMediatorProductsById(this.token, this.productId);
    }else if(this.isCompany){
      api$ = this.apiService.getCompanyProductById(this.token, this.productId);
    }else{
      api$ = this.apiService.getProductById(this.token, this.promoteId);
    }
    
    // const api$ =
    //   this.isCompany
    //     ? this.apiService.getCompanyProductById(this.token, this.productId)
    //     : (this.isMediator ? this.apiService.getMediatorProductsById(this.token, this.productId) : this.apiService.getProductById(this.token, this.productId));

    api$.subscribe({
      next: (res: any) => {
        this.product = this.extractProduct(res);
        if (!this.product) {
          this.error = 'Product not found.';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
        this.loading = false;
        this.promotionUpdating = false;
        this.submissionCurrentPage = 1;
        this.loadSubmissions(1);
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error(err);
        this.product = null;
        const error = err as { error?: { message?: string }; message?: string };
        this.error =
          error?.error?.message ||
          error?.message ||
          'Failed to load product details.';
        this.loading = false;
        this.promotionUpdating = false;
        this.cdr.detectChanges();
      },
    });
  }

  userSubmissionCount:any=0;
  private loadSubmissions(page: number = this.submissionCurrentPage): void {
    //const promoteId = this.promoteId;
    var productId = this.productId;

    if(this.role==ENTITY_TYPE_IDS.USER){
      productId = this.promoteId;
    }else{
      productId = this.productId;
    }
    if (!this.token || !productId) {
      return;
    }

    this.submissionsLoading = true;
    this.submissionsError = '';

    const perPage = this.submissionPerPage || undefined;
    let api$: Observable<unknown>;

    if (this.isUser) {
      api$ = this.apiService.getUserFromSubmission(
        this.token,
        productId,
        page,
        perPage
      );
    } else if (this.isMediator) {
      api$ = this.apiService.getMediatorFromSubmission(
        this.token,
        productId,
        page,
        perPage
      );
    } else {
      api$ = this.apiService.getFormSubmissions(
        this.token,
        productId,
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

        if(this.isUser){
          console.log(res);

          this.userSubmissionCount = res.data.data.length;

        }

        this.extractSubmissionHeads(res);
        this.applySubmissionPage(parsed);
        this.submissionsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error(err);
        this.submissions = [];
        this.formFieldColumns = [];
        this.refundFieldColumns = [];
        const error = err as { error?: { message?: string }; message?: string };
        this.submissionsError =
          error?.error?.message ||
          error?.message ||
          'Failed to load submissions.';
        this.submissionsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private applySubmissionPage(parsed: PaginatedPageMeta): void {
    const data = parsed.items;
    for (let i = 0; i < data.length; i++) {
      data[i].submission = this.parseSubmissionPayload(data[i].submission);
      data[i].refund_submission_text = this.parseSubmissionPayload(
        data[i].refund_submission_text
      );
    }

    this.submissions = data;
    this.submissionCurrentPage = parsed.currentPage;
    this.submissionLastPage = parsed.lastPage;
    this.submissionTotal = parsed.total;
    this.submissionPerPage = parsed.perPage;
    this.ensureSubmissionFieldColumns();
  }

  private extractSubmissionHeads(res: unknown): void {
    const payload = (res as { data?: Record<string, unknown> })?.data;
    this.formFieldColumns = this.normalizeHeads(
      payload?.['form_heads'],
      'submission'
    );
    this.refundFieldColumns = this.normalizeHeads(
      payload?.['form_submission_heads'],
      'refund_submission_text'
    );
  }

  private ensureSubmissionFieldColumns(): void {
    if (!this.formFieldColumns.length) {
      this.formFieldColumns = this.inferColumnsFromSubmissions('submission');
    }
    if (!this.refundFieldColumns.length) {
      this.refundFieldColumns = this.inferColumnsFromSubmissions(
        'refund_submission_text'
      );
    }
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
          const label = String(
            h['label'] ?? h['title'] ?? h['head'] ?? h['key'] ?? key
          );
          return { key, label, source };
        }
        return { key: String(index), label: String(head), source };
      });
    }

    if (typeof heads === 'object') {
      return Object.entries(heads as Record<string, unknown>).map(
        ([key, label]) => ({
          key,
          label: String(label),
          source,
        })
      );
    }

    return [];
  }

  private inferColumnsFromSubmissions(
    source: SubmissionFieldColumn['source']
  ): SubmissionFieldColumn[] {
    const columns: SubmissionFieldColumn[] = [];
    const seen = new Set<string>();
    const fieldName =
      source === 'submission' ? 'submission' : 'refund_submission_text';

    for (const s of this.submissions) {
      const sub = s[fieldName] as Record<string, unknown> | undefined;
      if (!sub || typeof sub !== 'object') {
        continue;
      }
      for (const key of Object.keys(sub)) {
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        const field = sub[key];
        let label = key;
        if (
          field &&
          typeof field === 'object' &&
          field !== null &&
          'label' in field
        ) {
          label = String((field as { label: unknown }).label);
        }
        columns.push({ key, label, source });
      }
    }

    return columns;
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

  private extractProduct(res: any): any {
    if (res?.data?.data && !Array.isArray(res.data.data)) {
      return res.data.data;
    }
    if (res?.data && !Array.isArray(res.data)) {
      return res.data;
    }
    return null;
  }

  viewForm(p:any): void {
    if (!this.product?.form_id) return;
    this.router.navigate(['/builder', p.form_id]);
  }
  

  refundForm(p:any): void {
    if (!this.product?.refund_form_id) return;
    this.router.navigate(['/builder', p.refund_form_id]);
  }

  viewSubmissions(): void {
    const id = this.product?.promote_id ?? this.productId;
    this.router.navigate(['/submission', id]);
  }

  downloadSubmissionExcel(): void {
    if (!this.showExcelDownload) {
      return;
    }
    const id = this.productId;
    if (!this.token || !id || this.excelDownloading) {
      return;
    }

    this.excelDownloading = true;
    this.cdr.detectChanges();

    this.apiService.getProductSubmissionExcel(this.token, id).subscribe({
      next: async (response) => {
        try {
          const blob = response.body;
          if (!blob) {
            throw new Error('Empty download response.');
          }

          const contentType = (response.headers.get('content-type') || '').toLowerCase();
          let isJson =
            contentType.includes('application/json') ||
            contentType.includes('text/json');

          // Some APIs omit content-type; sniff JSON payloads.
          if (!isJson && (!contentType || contentType.includes('octet-stream'))) {
            const probe = await blob.slice(0, 1).text();
            isJson = probe.trim().startsWith('{');
          }

          if (isJson) {
            const res = JSON.parse(await blob.text());
            const path =
              res?.data?.path ??
              res?.data?.url ??
              res?.data?.file ??
              res?.path ??
              res?.url ??
              res?.file ??
              (typeof res?.data === 'string' ? res.data : null);

            if (!path) {
              throw new Error(res?.message || 'Excel download path not found.');
            }

            this.downloadFromResolvedPath(String(path));
            return;
          }

          const headerName = this.filenameFromContentDisposition(
            response.headers.get('content-disposition')
          );
          this.saveBlobToDisk(blob, headerName || `product_${id}_submissions.csv`);
          this.excelDownloading = false;
          this.cdr.detectChanges();
        } catch (err: any) {
          alert(err?.message || 'Failed to download Excel file.');
          this.excelDownloading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        alert(
          err?.error?.message ||
            err?.message ||
            'Failed to download Excel file.'
        );
        this.excelDownloading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private downloadFromResolvedPath(path: string): void {
    const url = this.resolveDownloadUrl(path);
    const filename = url.split('/').pop()?.split('?')[0] || 'submissions.csv';

    // Fetch via same-origin proxy in dev (or absolute URL in prod) as blob,
    // then force a local file save — avoids CORS and new-tab opens.
    this.apiService.downloadFileAsBlob(url, null).subscribe({
      next: (fileBlob: Blob) => {
        this.saveBlobToDisk(fileBlob, filename);
        this.excelDownloading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Last resort without XHR: hidden iframe (no CORS, stays on page).
        this.saveViaHiddenIframe(this.resolvePublicAbsoluteUrl(path));
        this.excelDownloading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private saveBlobToDisk(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }

  private saveViaHiddenIframe(url: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.src = url;
    document.body.appendChild(iframe);
    window.setTimeout(() => {
      iframe.parentNode?.removeChild(iframe);
    }, 60_000);
  }

  private filenameFromContentDisposition(header: string | null): string | null {
    if (!header) {
      return null;
    }
    const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
    if (utfMatch?.[1]) {
      return decodeURIComponent(utfMatch[1].trim().replace(/["']/g, ''));
    }
    const plainMatch = /filename="?([^"]+)"?/i.exec(header);
    return plainMatch?.[1]?.trim() || null;
  }

  /** Relative web path under public/, e.g. uploads/excels/file.csv */
  private extractPublicRelativePath(path: string): string {
    let normalized = path.replace(/\\/g, '/');

    // Strip absolute URL origin if API returns a full http(s) link.
    try {
      if (/^https?:\/\//i.test(normalized)) {
        const url = new URL(normalized);
        normalized = url.pathname;
      }
    } catch {
      // keep normalized as-is
    }

    const uploadsMatch = normalized.match(/(?:^|\/)(uploads\/.+)$/i);
    if (uploadsMatch?.[1]) {
      return uploadsMatch[1];
    }
    const publicMatch = normalized.match(/\/public\/(.+)$/i);
    if (publicMatch?.[1]) {
      return publicMatch[1];
    }
    return normalized.replace(/^\/+/, '');
  }

  private resolveDownloadUrl(path: string): string {
    const relative = this.extractPublicRelativePath(path);

    // Always use the Angular dev-server proxy in local/dev to avoid CORS.
    // Never call http://localhost/.../uploads directly from HttpClient.
    if (!environment.production) {
      return `/revo-public/${relative}`;
    }

    const apiBase = environment.apiBaseUrl.endsWith('/')
      ? environment.apiBaseUrl
      : `${environment.apiBaseUrl}/`;
    return `${apiBase}${relative}`;
  }

  private resolvePublicAbsoluteUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const relative = this.extractPublicRelativePath(path);
    const apiBase = environment.apiBaseUrl.endsWith('/')
      ? environment.apiBaseUrl
      : `${environment.apiBaseUrl}/`;
    return `${apiBase}${relative}`;
  }

  viewRefundSubmissions(): void {
    const id = this.product?.promote_id ?? this.productId;
    this.router.navigate(['/refund/submission', id]);
  }

  openForm(): void {
    const id = this.product?.promote_id ?? this.promoteId;
    this.router.navigate(['/form', id]);
  }

  copyFormLink(): void {
    const id = this.product?.promote_id ?? this.promoteId;
    if (!id) {
      this.showCopyToast('Form link is not available yet.', false);
      return;
    }

    const link = `${environment.appUrl}/form/${id}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        this.formLinkCopied = true;
        this.showCopyToast('Form link copied to clipboard', true);
      })
      .catch(() => {
        this.showCopyToast('Could not copy the form link. Please try again.', false);
      });
  }

  dismissCopyToast(): void {
    this.copyToastVisible = false;
    this.cdr.detectChanges();
  }

  private showCopyToast(message: string, success: boolean): void {
    this.copyToastMessage = message;
    this.copyToastSuccess = success;
    this.copyToastVisible = true;
    if (this.copyToastTimer) {
      clearTimeout(this.copyToastTimer);
    }
    this.copyToastTimer = setTimeout(() => {
      this.copyToastVisible = false;
      this.formLinkCopied = false;
      this.cdr.detectChanges();
    }, 2800);
    this.cdr.detectChanges();
  }

  promoteProduct(): void {
    if (this.isMediator) {
      this.promotedemoteMediatorProduct(1);
      return;
    }
    this.updateProductPromotionStatus(1);
  }

  demoteProduct(): void {
    if (this.isMediator) {
      this.promotedemoteMediatorProduct(2);
      return;
    }
    this.updateProductPromotionStatus(0);
  }

  private updateProductPromotionStatus(status: number): void {
    console.log(this.product);
    if (this.product?.form_status == 1) {
      const productId = this.product?.id ?? this.productId;
      if (!productId) {
        alert('Product not found.');
        return;
      }

      this.promotionUpdating = true;
      this.apiService
        .promotedemoteProduct(this.token, { id: productId, status })
        .subscribe({
          next: () => {
            this.loadProduct();
            this.cdr.detectChanges();
          },
          error: (error: unknown) => {
            console.error(error);
            this.promotionUpdating = false;
            const err = error as {
              error?: { message?: string };
              message?: string;
            };
            alert(
              err?.error?.message ||
                err?.message ||
                'Failed to update promotion status.'
            );
            this.cdr.detectChanges();
          },
        });
      return;
    }

    alert('Please publish the form first');
  }

  private promotedemoteMediatorProduct(status: number): void {
    const productId = this.product?.id ?? this.productId;
    if (!productId) {
      alert('Product not found.');
      return;
    }

    this.promotionUpdating = true;
    this.apiService
      .promotedemoteMediatorProduct(this.token, {
        product_id: productId,
        status,
      })
      .subscribe({
        next: () => {
          this.loadProduct();
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          console.error(error);
          this.promotionUpdating = false;
          const err = error as {
            error?: { message?: string };
            message?: string;
          };
          alert(
            err?.error?.message ||
              err?.message ||
              'Failed to update promotion status.'
          );
          this.cdr.detectChanges();
        },
      });
  }
}
