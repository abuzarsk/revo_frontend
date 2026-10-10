import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilderService } from '../../../forms/form-builder.service';
import { Observable } from 'rxjs';
import { FormDefinition, FormElement, OptionsElement } from '../../../forms/form-element.model';
import { Apiservice } from '../../../../services/apiservice';
import { environment } from '../../../../environments/environment';
import { ENTITY_TYPE_IDS, IMAGE_FOLDERS, STORAGE_KEYS } from '../../../../constants';

interface FieldValue {
  value: any;
  touched: boolean;
  errors: string[];
}

interface ImageUploadState {
  status: 'idle' | 'uploading' | 'uploaded' | 'error';
  previewUrl?: string | null;
  error?: string;
}

@Component({
  selector: 'app-form-loading-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './form-loading.html',
  styleUrl: './form-loading.css',
})
export class FormLoadingPageComponent implements OnInit {
  private fb = inject(FormBuilderService);
  private platformId = inject(PLATFORM_ID);
  formDef$: Observable<FormDefinition> = this.fb.formDef$;
  
  fieldValues = new Map<string, FieldValue>();
  imageUploadStates = new Map<string, ImageUploadState>();
  /** Preview URLs keyed by element id — signal so zoneless UI updates. */
  readonly imageUploadPreviews = signal<Record<string, string>>({});
  isRefundForm: boolean = false;
  promote_id: any = "";
  encoded_product_id: any = "";
  token_obj: any = "";
  /** Signals so zoneless CD updates after HTTP. */
  readonly isLoading = signal(false);
  readonly formLoaded = signal(false);
  readonly productLoading = signal(false);
  readonly product = signal<any>(null);
  readonly errorMessage = signal('');
  readonly maxlimitreached = signal(false);
  readonly form_json = signal<any[]>([]);
  readonly isSubmitting = signal(false);
  readonly hasSubmission = signal(false);
  /** Guest flow: 1 = details + form, 2 = email / auth. */
  readonly guestStep = signal<1 | 2>(1);
  /** After checkEmail: null = email only, 1 = existing user (password), 2 = new user (signup). */
  readonly emailCheckStatus = signal<1 | 2 | null>(null);
  readonly isCheckingEmail = signal(false);
  readonly isGuestAuthSubmitting = signal(false);
  guestEmail = '';
  guestEmailTouched = false;
  guestEmailError = '';
  guestPassword = '';
  guestPasswordTouched = false;
  guestPasswordError = '';
  guestHidePassword = true;
  guestHideConfirmPassword = true;
  guestSignup = {
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };
  guestSignupTouched = {
    name: false,
    phone: false,
    password: false,
    confirmPassword: false,
  };
  guestSignupErrors: Record<string, string> = {};
  guestAuthError = '';
  environment = environment;
  form_id: any = null;
  submitError: string = '';
  submitSuccess: boolean = false;
  submission: any = null;
  form_data: any = {};
  submission_id: any = null;
  readonly year = new Date().getFullYear();

  get isLoggedIn(): boolean {
    return !!this.token_obj?.token;
  }

  get showGuestSteps(): boolean {
    return !this.isLoggedIn;
  }

  get showStep1Content(): boolean {
    return this.isLoggedIn || this.guestStep() === 1;
  }

  get showGuestEmailStep(): boolean {
    return this.showGuestSteps && this.guestStep() === 2;
  }

  get showGuestPasswordFields(): boolean {
    return this.showGuestEmailStep && this.emailCheckStatus() === 1;
  }

  get showGuestSignupFields(): boolean {
    return this.showGuestEmailStep && this.emailCheckStatus() === 2;
  }

  get guestStep2Title(): string {
    if (this.emailCheckStatus() === 1) {
      return 'Welcome back';
    }
    if (this.emailCheckStatus() === 2) {
      return 'Create your account';
    }
    return 'Enter your email';
  }

  get guestStep2Subtitle(): string {
    if (this.emailCheckStatus() === 1) {
      return 'This email already has an account. Enter your password to continue.';
    }
    if (this.emailCheckStatus() === 2) {
      return 'Complete a few details to create your account and submit the form.';
    }
    return 'We’ll check your email and guide you to sign in or create an account.';
  }

  get guestPrimaryActionLabel(): string {
    if (this.isCheckingEmail()) {
      return 'Checking...';
    }
    if (this.isGuestAuthSubmitting()) {
      return this.emailCheckStatus() === 1 ? 'Signing in...' : 'Creating account...';
    }
    if (this.emailCheckStatus() === 1) {
      return 'Sign in';
    }
    if (this.emailCheckStatus() === 2) {
      return 'Create account';
    }
    return 'Continue';
  }
  
  // Helper getter to access form definition
  get formDef(): FormDefinition {
    return this.fb.formDef;
  }

  /** Prefer dedicated product payload; fall back to fields nested in form response. */
  get displayProduct(): any | null {
    const product = this.product();
    if (product) {
      return product;
    }

    const d = this.form_data;
    if (!d || typeof d !== 'object') {
      return null;
    }

    return (
      d.product ||
      d.product_details ||
      d.promote?.product ||
      (Object.keys(d).length ? d : null)
    );
  }

  get hasSummaryDetails(): boolean {
    return !!(this.displayProduct || this.displayCompany);
  }

  get productDisplayName(): string {
    const p = this.displayProduct;
    if (!p) {
      return '—';
    }
    return (
      p.name ||
      p.product_name ||
      p.product_label ||
      p.title ||
      '—'
    );
  }

  get productBrandName(): string {
    const p = this.displayProduct;
    if (!p) {
      return '—';
    }
    return (
      p.brand_name ||
      p.brand?.brand_name ||
      p.brand?.name ||
      (typeof p.brand === 'string' ? p.brand : null) ||
      '—'
    );
  }

  get isMultipleSubmissionByOne(): string {
    const p = this.displayProduct;
    if (!p) {
      return '—';
    }
    const value = p.is_multiple_submission_by_one;
    if (value == null || value === '') {
      return '—';
    }
    if (value === true || value === 1 || value === '1') {
      return 'Yes';
    }
    if (value === false || value === 0 || value === '0') {
      return 'No';
    }
    return String(value);
  }

  get maxSubmissionByOne(): string {
    const p = this.displayProduct;
    if (!p || p.max_submission_by_one == null || p.max_submission_by_one === '') {
      return '—';
    }
    return String(p.max_submission_by_one);
  }

  get productPhotoUrl(): string | null {
    const p = this.displayProduct;
    if (!p) {
      return null;
    }
    const photo = p.photo || p.product_photo || p.product_image || p.image;
    return typeof photo === 'string' ? this.resolveMediaUrl(photo, 'products') : null;
  }

  get displayCompany(): Record<string, unknown> | null {
    const source = this.buildDetailsSource();
    if (!source) {
      return null;
    }

    const candidates = [
      source['company'],
      source['company_details'],
      source['company_info'],
      (source['product'] as Record<string, unknown> | undefined)?.['company'],
      (source['promote'] as Record<string, unknown> | undefined)?.['company'],
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        return candidate as Record<string, unknown>;
      }
    }

    const flatCompany: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(source)) {
      if (!key.startsWith('company_') || value == null || value === '') {
        continue;
      }
      flatCompany[key.replace(/^company_/, '')] = value;
    }

    return Object.keys(flatCompany).length ? flatCompany : null;
  }

  get companyDisplayName(): string {
    const c = this.displayCompany;
    const source = this.buildDetailsSource();
    if (c) {
      return String(
        c['name'] ||
          c['company_name'] ||
          c['alias'] ||
          c['company_alias'] ||
          c['title'] ||
          '—'
      );
    }
    return String(source?.['company_name'] || source?.['company_alias'] || '—');
  }

  get companyLogoUrl(): string | null {
    const c = this.displayCompany;
    const source = this.buildDetailsSource();
    const logo =
      (c && (c['logo'] || c['company_logo'] || c['company_image'])) ||
      source?.['company_logo'] ||
      source?.['logo'];
      return typeof logo === 'string' ? this.resolveMediaUrl(logo, (c && c['role'] == ENTITY_TYPE_IDS.COMPANY ?'companies' : 'mediators')) : null;
  }

  private buildDetailsSource(): Record<string, unknown> | null {
    const product = this.displayProduct;
    const formData =
      this.form_data && typeof this.form_data === 'object' ? (this.form_data as Record<string, unknown>) : null;

    if (!product && !formData) {
      return null;
    }

    const merged: Record<string, unknown> = {
      ...(formData ?? {}),
      ...((product && typeof product === 'object' ? product : {}) as Record<string, unknown>),
    };

    const nested =
      (merged['product'] as Record<string, unknown> | undefined) ||
      (merged['product_details'] as Record<string, unknown> | undefined);
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      Object.assign(merged, nested);
      if (nested['company'] && !merged['company']) {
        merged['company'] = nested['company'];
      }
    }

    return merged;
  }

  private resolveMediaUrl(path: string, folder: 'products' | 'companies' | 'mediators'): string | null {
    if (!path) {
      return null;
    }
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const base = this.environment.imageBaseUrl.endsWith('/')
      ? this.environment.imageBaseUrl
      : `${this.environment.imageBaseUrl}/`;
    return `${base}${folder}/${path.startsWith('/') ? path.slice(1) : path}`;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public ApiService: Apiservice,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.token_obj = JSON.parse(localStorage.getItem('token_obj') || '{}');

    this.route.params.subscribe((params) => {
      // Get the current URL (path only, no query or hash)
      const currentUrl = this.router.url;
      console.log('Current URL:', currentUrl);

      if(currentUrl.includes('refundform')) {
        this.isRefundForm = true;
      }
      const id = params['id'];
      if(this.isRefundForm) {
        this.submission_id = id;
      }else{
        this.promote_id = id;
      }
      if (!id) {
        return;
      }
      // if (!this.token_obj?.token) {
      //   this.errorMessage.set('Please log in to view this form.');
      //   this.cd.detectChanges();
      //   return;
      // }
      this.errorMessage.set('');
      this.maxlimitreached.set(false);
      this.loadProduct(id);
      this.loadForm(id);
    });
  }

  loadProduct(product_id: string) {
    if (!this.token_obj?.token) {
      console.error('No token found');
      this.productLoading.set(false);
      return;
    }

    this.productLoading.set(true);

    let apiService = this.isRefundForm ? this.ApiService.getProductFromRefundForm(this.token_obj.token, product_id) : this.ApiService.getProductById(this.token_obj.token, product_id);


    apiService.subscribe(
      (res: any) => {
        console.log('Product API Response:', res);
        if (res.data) {
          this.product.set(res.data);
        }
        this.productLoading.set(false);
        this.cd.markForCheck();
      },
      (error: any) => {
        console.error('Error loading product:', error);
        this.productLoading.set(false);
        this.cd.markForCheck();
      }
    );
  }

  loadForm(product_id: string) {
    // if (!this.token_obj?.token) {
    //   this.errorMessage.set('Please log in to view this form.');
    //   this.formLoaded.set(false);
    //   this.isLoading.set(false);
    //   this.cd.detectChanges();
    //   return;
    // }

    this.isLoading.set(true);
    this.formLoaded.set(false);
    this.form_json.set([]);

    let apiService = this.isRefundForm ? this.ApiService.getProductRefundForm(this.token_obj.token, product_id) : this.ApiService.getProductForm(this.token_obj.token, product_id);

    apiService.subscribe({
      next: (res: any) => {
        if (!res.data) {
          console.warn('No data in form response');
          this.formLoaded.set(false);
          this.isLoading.set(false);
          this.cd.markForCheck();
          return;
        }

        const d = res.data;
        this.form_id = d.id ?? d.form_id ?? null;
        this.form_data = d;

        if (!this.product()) {
          this.product.set(
            d.product ||
            d.product_details ||
            d.promote?.product ||
            null
          );
        }

        if (
          d.max_submission_by_one > 0 &&
          d.max_submission_by_one <= d.submission_count
        ) {
          this.errorMessage.set(
            'You have reached the maximum number of submissions for this product.'
          );
          this.maxlimitreached.set(true);
          this.formLoaded.set(false);
          this.isLoading.set(false);
          this.cd.markForCheck();
          return;
        }

        this.maxlimitreached.set(false);

        let formJsonData: unknown = null;
        if (d.form_json != null) {
          if (typeof d.form_json === 'string') {
            try {
              formJsonData = JSON.parse(d.form_json);
            } catch (e) {
              console.error('Error parsing form_json:', e);
            }
          } else {
            formJsonData = d.form_json;
          }
        }

        const elements = Array.isArray(formJsonData)
          ? formJsonData
          : (formJsonData as { elements?: FormElement[] } | null)?.elements ??
            [];

        this.form_json.set(elements);

        if (!elements.length) {
          this.formLoaded.set(false);
          this.isLoading.set(false);
          this.cd.markForCheck();
          return;
        }

        const formDefinition: FormDefinition = {
          title: d.form_name || 'Untitled Form',
          elements,
        };

        this.fb.setFormId(this.form_id != null ? String(this.form_id) : null);
        this.fb.setProductId(product_id);
        this.fb.loadFromJson(JSON.stringify(formDefinition));

        if (!this.fb.formDef.elements.length) {
          this.formLoaded.set(false);
          this.isLoading.set(false);
          this.cd.markForCheck();
          return;
        }

        this.fieldValues.clear();
        this.submitSuccess = false;
        this.submitError = '';

        this.formLoaded.set(true);
        this.isLoading.set(false);
        this.cd.markForCheck();
      },
      error: (error: any) => {
        console.error('Error loading form:', error);
        this.formLoaded.set(false);
        this.form_json.set([]);
        this.isLoading.set(false);
        this.errorMessage.set(
          error?.error?.message ||
          error?.message ||
          'Failed to load form. Please try again.'
        );
        this.cd.markForCheck();
      },
    });
  }

  populateFormWithSubmission() {
    if (!this.submission) {
      return;
    }

    const formDef = this.fb.formDef;
    
    formDef.elements.forEach((el) => {
      if (this.isInputField(el)) {
        // Check if submission data has this field
        if (this.submission[el.id]) {
          const fieldData = this.submission[el.id];
          
          // Handle different data structures
          let value: any = null;
          if (typeof fieldData === 'object' && fieldData !== null && fieldData.value !== undefined) {
            value = fieldData.value;
          } else {
            value = fieldData;
          }
          
          if (el.type === 'checkbox') {
            // For checkboxes, value is an array of selected options
            if (Array.isArray(value)) {
              const checkboxElement = el as OptionsElement;
              const options = checkboxElement.options || [];
              options.forEach((opt: string, index: number) => {
                const isChecked = value.includes(opt);
                this.setFieldValue(el.id + '_' + index, isChecked);
              });
            }
          } else {
            // For all other field types
            this.setFieldValue(el.id, value);
          }
        }
      }
    });
    
    console.log('Form populated with submission data');
    
    if (this.cd && typeof this.cd.detectChanges === 'function') {
      this.cd.detectChanges();
    }
  }

  getFieldValue(elementId: string): FieldValue {
    if (!this.fieldValues.has(elementId)) {
      this.fieldValues.set(elementId, { value: '', touched: false, errors: [] });
    }
    return this.fieldValues.get(elementId)!;
  }

  setFieldValue(elementId: string, value: any) {
    const field = this.getFieldValue(elementId);
    field.value = value;
    field.errors = this.validateField(elementId, value);
  }

  onFieldBlur(elementId: string) {
    const field = this.getFieldValue(elementId);
    field.touched = true;
    field.errors = this.validateField(elementId, field.value);
  }

  getImageUploadState(elementId: string): ImageUploadState {
    if (!this.imageUploadStates.has(elementId)) {
      this.imageUploadStates.set(elementId, { status: 'idle', previewUrl: null });
    }
    return this.imageUploadStates.get(elementId)!;
  }

  isImageUploading(elementId: string): boolean {
    return this.getImageUploadState(elementId).status === 'uploading';
  }

  isImageUploaded(elementId: string): boolean {
    return this.getImageUploadState(elementId).status === 'uploaded';
  }

  getImageUploadError(elementId: string): string {
    const state = this.getImageUploadState(elementId);
    return state.status === 'error' ? state.error || 'Upload failed.' : '';
  }

  getImageUploadPreview(elementId: string): string | null {
    return this.imageUploadPreviews()[elementId] || null;
  }

  private setImageUploadPreview(elementId: string, url: string | null): void {
    const current = this.imageUploadPreviews()[elementId];
    if (current?.startsWith('blob:') && current !== url) {
      URL.revokeObjectURL(current);
    }

    const next = { ...this.imageUploadPreviews() };
    if (url) {
      next[elementId] = url;
    } else {
      delete next[elementId];
    }
    this.imageUploadPreviews.set(next);
  }

  onImageUploadSelected(elementId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const state = this.getImageUploadState(elementId);

    if (!file) {
      this.setImageUploadPreview(elementId, null);
      this.setFieldValue(elementId, '');
      state.status = 'idle';
      state.error = undefined;
      this.cd.detectChanges();
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.setImageUploadPreview(elementId, null);
      state.status = 'error';
      state.error = 'Please select an image file.';
      this.setFieldValue(elementId, '');
      input.value = '';
      this.onFieldBlur(elementId);
      this.cd.detectChanges();
      return;
    }

    // Always show local preview immediately on select.
    const localPreview = URL.createObjectURL(file);
    this.setImageUploadPreview(elementId, localPreview);
    state.status = 'uploading';
    state.error = undefined;
    this.cd.detectChanges();

    // if (!this.token_obj?.token) {
    //   state.status = 'error';
    //   state.error = 'Please sign in to upload an image.';
    //   this.setFieldValue(elementId, '');
    //   this.onFieldBlur(elementId);
    //   this.cd.detectChanges();
    //   return;
    // }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('file', file);

    this.ApiService.uploadFormImage(this.token_obj.token, formData).subscribe({
      next: (res: any) => {
        const uploaded =
          res?.data?.url ??
          res?.data?.path ??
          res?.data?.filename ??
          res?.data?.file ??
          res?.data?.image ??
          res?.data?.name ??
          (typeof res?.data === 'string' ? res.data : null) ??
          res?.url ??
          res?.path ??
          res?.filename ??
          res?.file;

        if (!uploaded) {
          state.status = 'error';
          state.error = res?.message || 'Upload failed. No file path returned.';
          this.setFieldValue(elementId, '');
          this.onFieldBlur(elementId);
          this.cd.detectChanges();
          return;
        }

        const value = String(uploaded);
        this.setFieldValue(elementId, value);
        state.status = 'uploaded';
        state.error = undefined;

        // Keep local blob preview (reliable). Optionally switch to server URL.
        const remotePreview = this.resolveFormImageUrl(value);
        if (remotePreview && !remotePreview.startsWith('blob:')) {
          // Keep local preview visible; remote may 404 depending on folder name.
          // Prefer local blob so the user always sees the image they selected.
          this.setImageUploadPreview(elementId, localPreview);
        }

        this.onFieldBlur(elementId);
        this.cd.detectChanges();
      },
      error: (err: any) => {
        state.status = 'error';
        state.error =
          err?.error?.message || err?.message || 'Failed to upload image.';
        this.setFieldValue(elementId, '');
        // Keep preview so user still sees selected image even if upload failed.
        this.onFieldBlur(elementId);
        this.cd.detectChanges();
      },
    });
  }

  private resolveFormImageUrl(path: string): string | null {
    if (!path) {
      return null;
    }
    if (/^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) {
      return path;
    }
    const apiBase = this.environment.apiBaseUrl.endsWith('/')
      ? this.environment.apiBaseUrl
      : `${this.environment.apiBaseUrl}/`;
    const imageBase = this.environment.imageBaseUrl.endsWith('/')
      ? this.environment.imageBaseUrl
      : `${this.environment.imageBaseUrl}/`;
    const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');

    const uploadsMatch = normalized.match(/(?:^|\/)(uploads\/.+)$/i);
    if (uploadsMatch?.[1]) {
      return `${apiBase}${uploadsMatch[1]}`;
    }
    if (normalized.startsWith('uploads/')) {
      return `${apiBase}${normalized}`;
    }
    if (normalized.includes('/')) {
      return `${imageBase}${normalized.replace(/^uploads\//i, '')}`;
    }
    return `${imageBase}${IMAGE_FOLDERS.FORM_IMAGES}/${normalized}`;
  }

  validateField(elementId: string, value: any): string[] {
    const formDef = this.fb.formDef;
    const element = formDef.elements.find((e) => e.id === elementId);
    if (!element) return [];

    const errors: string[] = [];

    if (element.type === 'checkbox') {
      const hasSelection = this.hasCheckboxSelection(elementId);
      if (element.required && !hasSelection) {
        errors.push(`${element.label || 'This field'} is required`);
      }
      return errors;
    }

    if (element.type === 'radio' || element.type === 'dropdown') {
      const hasValue = value !== null && value !== undefined && value !== '' && String(value).trim().length > 0;
      if (element.required && !hasValue) {
        errors.push(`${element.label || 'This field'} is required`);
      }
      return errors;
    }

    if (element.type === 'file' || element.type === 'image_upload') {
      const hasFile = value && value !== '';
      if (element.required && !hasFile) {
        errors.push(`${element.label || 'This field'} is required`);
      }
      return errors;
    }

    if (element.type === 'date') {
      const hasValue = value && String(value).trim().length > 0;
      if (element.required && !hasValue) {
        errors.push(`${element.label || 'This field'} is required`);
      }

      if (hasValue && element.validation) {
        const selectedDate = new Date(value);
        const minDate = element.validation.minDate ? new Date(element.validation.minDate) : null;
        const maxDate = element.validation.maxDate ? new Date(element.validation.maxDate) : null;

        selectedDate.setHours(0, 0, 0, 0);
        if (minDate) minDate.setHours(0, 0, 0, 0);
        if (maxDate) maxDate.setHours(0, 0, 0, 0);

        if (minDate && selectedDate < minDate) {
          const minDateStr = minDate.toLocaleDateString();
          errors.push(`Date must be on or after ${minDateStr}`);
        }

        if (maxDate && selectedDate > maxDate) {
          const maxDateStr = maxDate.toLocaleDateString();
          errors.push(`Date must be on or before ${maxDateStr}`);
        }
      }

      return errors;
    }

    const stringValue = String(value || '').trim();
    const hasValue = stringValue.length > 0;

    if (element.required && !hasValue) {
      errors.push(`${element.label || 'This field'} is required`);
    }

    if (!hasValue && !element.required) {
      return errors;
    }

    if (element.validation?.minLength && stringValue.length < element.validation.minLength) {
      errors.push(`Minimum length is ${element.validation.minLength} characters`);
    }

    if (element.validation?.maxLength && stringValue.length > element.validation.maxLength) {
      errors.push(`Maximum length is ${element.validation.maxLength} characters`);
    }

    if (element.type === 'email' && hasValue) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(stringValue)) {
        errors.push('Please enter a valid email address');
      }
    }

    if (element.validation?.pattern && hasValue) {
      try {
        let regex: RegExp;
        if (element.validation.pattern === 'email') {
          regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!regex.test(stringValue)) {
            errors.push('Please enter a valid email address');
          }
        } else if (element.validation.pattern === 'number') {
          regex = /^\d+$/;
          if (!regex.test(stringValue)) {
            errors.push('Please enter numbers only');
          }
        } else if (element.validation.pattern === 'text') {
          const lettersOnlyPattern = /^[a-zA-Z\s]+$/;
          if (!lettersOnlyPattern.test(stringValue)) {
            errors.push('Text field only allows alphabets (letters), no numbers or special characters');
          }
        } else {
          regex = new RegExp(element.validation.pattern);
          if (!regex.test(stringValue)) {
            errors.push('Invalid format');
          }
        }
      } catch (e) {
        // Invalid regex pattern - skip
      }
    }

    return errors;
  }

  hasCheckboxSelection(elementId: string): boolean {
    const formDef = this.fb.formDef;
    const element = formDef.elements.find((e) => e.id === elementId);
    if (!element || element.type !== 'checkbox') return false;

    const checkboxElement = element as OptionsElement;
    const options = checkboxElement.options || [];
    return options.some((opt: string, index: number) => {
      const field = this.getFieldValue(elementId + '_' + index);
      return field.value === true;
    });
  }

  updateCheckboxGroup(elementId: string, option: string, checked: boolean) {
    setTimeout(() => {
      const field = this.getFieldValue(elementId);
      field.errors = this.validateField(elementId, null);
    }, 0);
  }

  hasErrors(elementId: string): boolean {
    const field = this.getFieldValue(elementId);
    return field.touched && field.errors.length > 0;
  }

  getErrors(elementId: string): string[] {
    const field = this.getFieldValue(elementId);
    return field.touched ? field.errors : [];
  }

  onSubmit() {
    if (!this.validateFormFields()) {
      alert('Please fix the errors before submitting.');
      return;
    }

    if (!this.form_id) {
      alert('Form ID not found. Cannot submit form.');
      return;
    }

    if (this.isRefundForm) {
      if (!this.token_obj?.token) {
        alert('Authentication token not found. Please login again.');
        return;
      }
      this.submitRefundForm();
      return;
    }

    if (!this.token_obj?.token) {
      alert('Authentication token not found. Please login again.');
      return;
    }

    this.submitProductForm();
  }

  private validateFormFields(): boolean {
    const formDef = this.fb.formDef;
    formDef.elements.forEach((el) => {
      if (this.isInputField(el)) {
        const field = this.getFieldValue(el.id);
        field.touched = true;
        field.errors = this.validateField(el.id, field.value);
      }
    });

    return formDef.elements.every((el) => {
      if (!this.isInputField(el)) {
        return true;
      }
      return this.getFieldValue(el.id).errors.length === 0;
    });
  }

  private collectFormSubmissionData(): Record<string, { label: string; value: unknown }> {
    const formDef = this.fb.formDef;
    const formData: Record<string, { label: string; value: unknown }> = {};

    formDef.elements.forEach((el) => {
      if (!this.isInputField(el)) {
        return;
      }

      if (el.type === 'checkbox') {
        const checkboxElement = el as OptionsElement;
        const options = checkboxElement.options || [];
        const selectedOptions: string[] = [];

        options.forEach((opt: string, index: number) => {
          const checkboxField = this.getFieldValue(el.id + '_' + index);
          if (checkboxField.value === true) {
            selectedOptions.push(opt);
          }
        });

        formData[el.id] = {
          label: el.label || el.type,
          value: selectedOptions,
        };
      } else {
        const field = this.getFieldValue(el.id);
        formData[el.id] = {
          label: el.label || el.type,
          value: field.value ?? null,
        };
      }
    });

    return formData;
  }

  private submitProductForm(loginDetails?: Record<string, unknown>): void {
    const formData = this.collectFormSubmissionData();
    const payload: Record<string, unknown> = {
      promote_id: this.promote_id,
      form_id: this.form_id,
      submission: JSON.stringify(formData),
    };

    if (loginDetails) {
      payload['login_details'] = loginDetails;
    }else{
      payload['login_details'] = {
        auth_type: 'already_logged_in',
      };
    }

    const isGuestSubmit = !!loginDetails;
    if (isGuestSubmit) {
      this.isGuestAuthSubmitting.set(true);
      this.guestAuthError = '';
    } else {
      this.isSubmitting.set(true);
      this.submitError = '';
      this.submitSuccess = false;
    }
    this.cd.markForCheck();

    const token = isGuestSubmit ? null : this.token_obj?.token;
    this.ApiService.postAuthProductForm(payload, token).subscribe({
      next: (response: any) => this.handleProductFormSubmitSuccess(response, isGuestSubmit),
      error: (error: any) => this.handleProductFormSubmitError(error, isGuestSubmit),
    });
  }

  private submitRefundForm(): void {
    const formData = this.collectFormSubmissionData();
    const payload = {
      form_id: this.form_id,
      submission: JSON.stringify(formData),
      submission_id: this.submission_id,
    };

    this.isSubmitting.set(true);
    this.submitError = '';
    this.submitSuccess = false;
    this.cd.markForCheck();

    this.ApiService.refundFormSubmission(this.token_obj.token, payload).subscribe({
      next: (response: any) => this.handleProductFormSubmitSuccess(response, false),
      error: (error: any) => this.handleProductFormSubmitError(error, false),
    });
  }

  private handleProductFormSubmitSuccess(response: any, isGuestSubmit: boolean): void {
    if (isGuestSubmit) {
      this.isGuestAuthSubmitting.set(false);
    } else {
      this.isSubmitting.set(false);
      this.submitSuccess = true;
    }

    if (response?.data?.token) {
      this.persistAuthSession(response.data);
    }

    this.clearGuestFormDraft();
    this.fieldValues.clear();
    alert(response?.message || 'Form submitted successfully!');
    this.cd.markForCheck();
    window.location.reload();
  }

  private handleProductFormSubmitError(error: any, isGuestSubmit: boolean): void {
    const message = error?.error?.message || error?.message || 'Failed to submit form. Please try again.';

    if (isGuestSubmit) {
      this.isGuestAuthSubmitting.set(false);
      this.guestAuthError = message;
    } else {
      this.isSubmitting.set(false);
      this.submitError = message;
    }

    alert(message);
    this.cd.markForCheck();
  }

  private clearGuestFormDraft(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('form_next_step_draft');
    }
  }

  private isInputField(el: FormElement): boolean {
    return !['heading', 'divider', 'image', 'button'].includes(el.type);
  }

  goBackToProducts(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/products']);
      return;
    }
    this.router.navigate(['/login']);
  }

  goHome(): void {
    this.router.navigate([this.isLoggedIn ? '/' : '/login']);
  }

  goToGuestStep1(): void {
    this.guestStep.set(1);
    this.resetGuestAuthState();
    this.cd.markForCheck();
  }

  onGuestEmailInput(value: string): void {
    this.guestEmail = value;
    if (this.emailCheckStatus() != null) {
      this.resetGuestAuthState(false);
    }
    if (this.guestEmailTouched) {
      this.guestEmailError = this.validateGuestEmail(value);
    }
  }

  changeGuestEmail(): void {
    this.emailCheckStatus.set(null);
    this.guestAuthError = '';
    this.guestPassword = '';
    this.guestPasswordTouched = false;
    this.guestPasswordError = '';
    this.guestSignup = { name: '', phone: '', password: '', confirmPassword: '' };
    this.guestSignupErrors = {};
    this.cd.markForCheck();
  }

  onGuestEmailBlur(): void {
    this.guestEmailTouched = true;
    this.guestEmailError = this.validateGuestEmail(this.guestEmail);
    this.cd.markForCheck();
  }

  private validateGuestEmail(value: string): string {
    const email = (value || '').trim();
    if (!email) {
      return 'Email is required.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email.';
    }
    return '';
  }

  private resetGuestAuthState(clearEmail = true): void {
    this.emailCheckStatus.set(null);
    this.guestAuthError = '';
    this.guestPassword = '';
    this.guestPasswordTouched = false;
    this.guestPasswordError = '';
    this.guestHidePassword = true;
    this.guestHideConfirmPassword = true;
    this.guestSignup = { name: '', phone: '', password: '', confirmPassword: '' };
    this.guestSignupTouched = {
      name: false,
      phone: false,
      password: false,
      confirmPassword: false,
    };
    this.guestSignupErrors = {};
    if (clearEmail) {
      this.guestEmail = '';
      this.guestEmailTouched = false;
      this.guestEmailError = '';
    }
  }

  /** Guest step 1 → step 2 (email). */
  onNextStep(): void {
    if (this.isLoggedIn) {
      return;
    }

    const formDef = this.fb.formDef;
    formDef.elements.forEach((el) => {
      if (this.isInputField(el)) {
        const field = this.getFieldValue(el.id);
        field.touched = true;
        field.errors = this.validateField(el.id, field.value);
      }
    });

    let isValid = true;
    formDef.elements.forEach((el) => {
      if (this.isInputField(el)) {
        const field = this.getFieldValue(el.id);
        if (field.errors.length > 0) {
          isValid = false;
        }
      }
    });

    if (!isValid) {
      alert('Please fix the errors before continuing.');
      this.cd.markForCheck();
      return;
    }

    this.saveGuestFormDraft();
    this.guestStep.set(2);
    this.resetGuestAuthState();
    this.cd.markForCheck();
  }

  continueWithGuestEmail(): void {
    this.guestEmailTouched = true;
    this.guestEmailError = this.validateGuestEmail(this.guestEmail);
    if (this.guestEmailError) {
      this.cd.markForCheck();
      return;
    }

    if (this.emailCheckStatus() === 1) {
      this.submitGuestLogin();
      return;
    }

    if (this.emailCheckStatus() === 2) {
      this.submitGuestSignup();
      return;
    }

    this.checkGuestEmail();
  }

  private checkGuestEmail(): void {
    const email = this.guestEmail.trim();
    this.isCheckingEmail.set(true);
    this.guestAuthError = '';
    this.cd.markForCheck();

    this.ApiService.checkEmail({ email }).subscribe({
      next: (res: any) => {
        this.isCheckingEmail.set(false);
        const status = Number(res?.status ?? res?.data?.status ?? res?.data);
        if (status === 1 || status === 2) {
          this.emailCheckStatus.set(status as 1 | 2);
          this.saveGuestFormDraft(email);
        } else {
          this.guestAuthError = res?.message || 'Unable to verify email. Please try again.';
        }
        this.cd.markForCheck();
      },
      error: (error: any) => {
        this.isCheckingEmail.set(false);
        this.guestAuthError =
          error?.error?.message || error?.message || 'Unable to verify email. Please try again.';
        this.cd.markForCheck();
      },
    });
  }

  private submitGuestLogin(): void {
    this.guestPasswordTouched = true;
    this.guestPasswordError = this.guestPassword.trim() ? '' : 'Password is required.';
    if (this.guestPasswordError) {
      this.cd.markForCheck();
      return;
    }

    this.submitProductForm({
      auth_type: 'login',
      value: this.guestEmail.trim(),
      password: this.guestPassword,
      emailormobile: 'EMAIL',
    });
  }

  private submitGuestSignup(): void {
    this.guestSignupTouched = {
      name: true,
      phone: true,
      password: true,
      confirmPassword: true,
    };
    this.guestSignupErrors = this.validateGuestSignup();
    if (Object.keys(this.guestSignupErrors).length) {
      this.cd.markForCheck();
      return;
    }

    this.submitProductForm({
      auth_type: 'signup',
      name: this.guestSignup.name.trim(),
      email: this.guestEmail.trim(),
      phone: this.guestSignup.phone.trim(),
      password: this.guestSignup.password,
      role: String(ENTITY_TYPE_IDS.USER),
    });
  }

  private validateGuestSignup(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!this.guestSignup.name.trim() || this.guestSignup.name.trim().length < 2) {
      errors['name'] = 'Name must be at least 2 characters.';
    }
    if (!/^[0-9+\-\s()]{10,}$/.test(this.guestSignup.phone.trim())) {
      errors['phone'] = 'Enter a valid phone number.';
    }
    if (!this.guestSignup.password) {
      errors['password'] = 'Password is required.';
    }
    if (!this.guestSignup.confirmPassword) {
      errors['confirmPassword'] = 'Please confirm your password.';
    } else if (this.guestSignup.password !== this.guestSignup.confirmPassword) {
      errors['confirmPassword'] = 'Passwords do not match.';
    }
    return errors;
  }

  private persistAuthSession(data: any): void {
    if (!isPlatformBrowser(this.platformId) || !data?.token) {
      return;
    }
    localStorage.setItem(STORAGE_KEYS.TOKEN_OBJ, JSON.stringify(data));
    if (data?.user?.default_role != null) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, JSON.stringify(data.user.default_role));
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, JSON.stringify(ENTITY_TYPE_IDS.USER));
    }
  }

  toggleGuestPasswordVisibility(): void {
    this.guestHidePassword = !this.guestHidePassword;
  }

  toggleGuestConfirmPasswordVisibility(): void {
    this.guestHideConfirmPassword = !this.guestHideConfirmPassword;
  }

  private saveGuestFormDraft(email?: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const formDef = this.fb.formDef;
    const draft: Record<string, any> = {};
    formDef.elements.forEach((el) => {
      if (!this.isInputField(el)) {
        return;
      }
      if (el.type === 'checkbox') {
        const checkboxElement = el as OptionsElement;
        const options = checkboxElement.options || [];
        const selectedOptions: string[] = [];
        options.forEach((opt: string, index: number) => {
          const checkboxField = this.getFieldValue(el.id + '_' + index);
          if (checkboxField.value === true) {
            selectedOptions.push(opt);
          }
        });
        draft[el.id] = { label: el.label || el.type, value: selectedOptions };
      } else {
        const field = this.getFieldValue(el.id);
        draft[el.id] = { label: el.label || el.type, value: field.value || null };
      }
    });

    sessionStorage.setItem(
      'form_next_step_draft',
      JSON.stringify({
        returnUrl: this.router.url,
        form_id: this.form_id,
        promote_id: this.promote_id,
        submission_id: this.submission_id,
        isRefundForm: this.isRefundForm,
        draft,
        email: email || this.guestEmail.trim() || undefined,
      })
    );
  }
}

