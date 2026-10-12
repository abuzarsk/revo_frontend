import { ChangeDetectorRef, Component, DestroyRef, HostBinding, HostListener, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { map } from 'rxjs';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ENTITY_TYPE_IDS, ENTITY_TYPES, STORAGE_KEYS } from '../../../constants';
import { Apiservice } from '../../../services/apiservice';

const urlPattern =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const form = group as FormGroup;
    const password = form.get('password')?.value;
    const confirm = form.get('confirmPassword');
    const confirmValue = confirm?.value;
    if (password !== confirmValue) {
      const errors = { ...(confirm?.errors ?? {}), passwordMismatch: true };
      confirm?.setErrors(errors);
      return { passwordMismatch: true };
    }
    const errs = { ...(confirm?.errors ?? {}) };
    delete errs['passwordMismatch'];
    confirm?.setErrors(Object.keys(errs).length ? errs : null);
    return null;
  };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  protected submitted = false;
  protected hidePassword = true;
  protected hideConfirmPassword = true;

  /** Selected logo file (company signup only). */
  protected selectedLogoFile: File | null = null;
  /** Data URL for logo preview. */
  protected logoPreview: string | null = null;

  /** Selected profile picture (mediator signup only). */
  protected selectedProfileFile: File | null = null;
  /** Data URL for profile picture preview. */
  protected profilePreview: string | null = null;

  type: string = ENTITY_TYPES.USER;

  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  /** Show success overlay after signup, then redirect to login. */
  protected showSuccessOverlay = false;
  /** When true, overlay shows company-pending message (use account as user until company is created). */
  protected isCompanyPendingOverlay = false;
  /** True when signup API returned auth data and user can continue without re-login. */
  protected hasSignupSession = false;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private apiservice: Apiservice,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => this.resolveSignupType(params.get('type'))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((type) => this.applySignupType(type));

    this.destroyRef.onDestroy(() => this.setBodyScrollLocked(false));
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (this.showSuccessOverlay) {
      this.completeSignupFlow();
    }
  }

  @HostBinding('class.signup-overlay-open')
  protected get isOverlayOpen(): boolean {
    return this.showSuccessOverlay;
  }

  private resolveSignupType(raw: string | null): string {
    const type = raw ?? ENTITY_TYPES.USER;
    const valid = [ENTITY_TYPES.USER, ENTITY_TYPES.COMPANY, ENTITY_TYPES.MEDIATOR] as string[];
    return valid.includes(type) ? type : ENTITY_TYPES.USER;
  }

  private applySignupType(type: string): void {
    if (type === this.type && this.signupForm) {
      return;
    }

    this.type = type;
    this.resetSignupState();

    if (this.type === ENTITY_TYPES.COMPANY) {
      this.signupForm = this.buildCompanyForm();
    } else if (this.type === ENTITY_TYPES.MEDIATOR) {
      this.signupForm = this.buildMediatorForm();
    } else {
      this.signupForm = this.buildUserForm();
    }

    this.cdr.detectChanges();
  }

  private resetSignupState(): void {
    this.submitted = false;
    this.hidePassword = true;
    this.hideConfirmPassword = true;
    this.selectedLogoFile = null;
    this.logoPreview = null;
    this.selectedProfileFile = null;
    this.profilePreview = null;
    this.isSubmitting = false;
    this.submitError = null;
    this.closeSuccessOverlay();
  }

  private buildUserForm(): FormGroup {
    return this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{10,}$/)]],
        password: ['', [Validators.required]],//, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator() }
    );
  }

  private buildMediatorForm(): FormGroup {
    return this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{10,}$/)]],
        password: ['', [Validators.required]],//, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        profile_picture: [null as File | null],
        alias: [''],
        size: [''],
        group_link: ['', [Validators.pattern(urlPattern)]],
        slot_in_a_month: [''],
        description: [''],
      },
      { validators: passwordMatchValidator() }
    );
  }

  private buildCompanyForm(): FormGroup {
    return this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{10,}$/)]],
        password: ['', [Validators.required]],//, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        logo: [null as File | null],
        alias: [''],
        size: [''],
        group_link: ['', [Validators.pattern(urlPattern)]],
        slot_in_a_month: [''],
        description: [''],
      },
      { validators: passwordMatchValidator() }
    );
  }

  protected get title(): string {
    if (this.type === ENTITY_TYPES.COMPANY) {
      return 'Company signup';
    }
    if (this.type === ENTITY_TYPES.MEDIATOR) {
      return 'Mediator signup';
    }
    return 'Create account';
  }

  protected get subtitle(): string {
    if (this.type === ENTITY_TYPES.COMPANY) {
      return 'Register your organization on Revo';
    }
    if (this.type === ENTITY_TYPES.MEDIATOR) {
      return 'Join as a mediator partner';
    }
    return 'Sign up for your customer dashboard';
  }

  protected readonly year = new Date().getFullYear();

  protected get overlayPrimaryActionLabel(): string {
    if (this.isCompanyPendingOverlay && this.hasSignupSession) {
      return 'Continue as user';
    }
    if (this.isCompanyPendingOverlay) {
      return 'Login';
    }
    return this.hasSignupSession ? 'Go to dashboard' : 'Go to login';
  }

  protected get overlayTitle(): string {
    if (this.isCompanyPendingOverlay) {
      return 'Company registration in progress';
    }
    if (this.type === ENTITY_TYPES.MEDIATOR) {
      return 'Mediator account created';
    }
    return 'Account created';
  }

  protected get overlayMessage(): string {
    if (this.isCompanyPendingOverlay) {
      return 'We will update you once your company is verified. Meanwhile you can use the account as a normal user.';
    }
    if (this.hasSignupSession) {
      return 'Your account is ready. You can continue to your dashboard now.';
    }
    return 'You can now sign in with your credentials.';
  }

  protected get heroTitle(): string {
    if (this.type === ENTITY_TYPES.COMPANY) {
      return 'Grow your business,';
    }
    if (this.type === ENTITY_TYPES.MEDIATOR) {
      return 'Connect companies,';
    }
    return 'Your orders,';
  }

  protected get heroTitleAccent(): string {
    if (this.type === ENTITY_TYPES.COMPANY) {
      return 'one dashboard.';
    }
    if (this.type === ENTITY_TYPES.MEDIATOR) {
      return 'one platform.';
    }
    return 'one place.';
  }

  protected get heroSubtitle(): string {
    if (this.type === ENTITY_TYPES.COMPANY) {
      return 'Create a company account to manage products, submissions, refunds, and mediator partnerships from one place.';
    }
    if (this.type === ENTITY_TYPES.MEDIATOR) {
      return 'Register as a mediator to connect with companies, review submissions, and support customer orders.';
    }
    return 'Create your account to track submissions, view payment status, manage refunds, and access your premium dashboard.';
  }

  protected isSubmitting = false;
  protected submitError: string | null = null;

  protected get heroBadge(): string {
    if (this.type === ENTITY_TYPES.COMPANY) {
      return 'Company Registration';
    }
    if (this.type === ENTITY_TYPES.MEDIATOR) {
      return 'Mediator Onboarding';
    }
    return 'Secure Customer Portal';
  }

  protected get roleLabel(): string {
    if (this.type === ENTITY_TYPES.COMPANY) {
      return 'Company';
    }
    if (this.type === ENTITY_TYPES.MEDIATOR) {
      return 'Mediator';
    }
    return 'Customer';
  }

  protected get rolePillClass(): string {
    if (this.type === ENTITY_TYPES.COMPANY) {
      return 'role-pill--company';
    }
    if (this.type === ENTITY_TYPES.MEDIATOR) {
      return 'role-pill--mediator';
    }
    return 'role-pill--user';
  }

  protected get submitLabel(): string {
    if (this.type === ENTITY_TYPES.COMPANY) {
      return 'Create company account';
    }
    if (this.type === ENTITY_TYPES.MEDIATOR) {
      return 'Create mediator account';
    }
    return 'Create account';
  }

  protected get features() {
    if (this.type === ENTITY_TYPES.COMPANY) {
      return [
        { icon: 'fa-briefcase', tone: 'blue', title: 'Manage products', text: 'Launch offerings and control promotions.' },
        { icon: 'fa-line-chart', tone: 'purple', title: 'Track submissions', text: 'Monitor orders and refund activity live.' },
        { icon: 'fa-users', tone: 'violet', title: 'Mediator network', text: 'Connect with partners to scale operations.' },
      ];
    }
    if (this.type === ENTITY_TYPES.MEDIATOR) {
      return [
        { icon: 'fa-handshake-o', tone: 'blue', title: 'Company connections', text: 'Partner with verified organizations.' },
        { icon: 'fa-check-square-o', tone: 'purple', title: 'Review submissions', text: 'Approve refunds and resolve requests.' },
        { icon: 'fa-comments', tone: 'violet', title: 'Customer support', text: 'Help users with order issues quickly.' },
      ];
    }
    return [
      { icon: 'fa-truck', tone: 'blue', title: 'Track every order', text: 'Real-time status on all submissions.' },
      { icon: 'fa-file-text-o', tone: 'purple', title: 'Payment history', text: 'View receipts and confirmations.' },
      { icon: 'fa-headphones', tone: 'violet', title: 'Fast support', text: 'Refund requests handled with care.' },
    ];
  }

  protected showError(controlName: string): boolean {
    const control = this.signupForm.get(controlName);
    return !!(control?.invalid && (control.dirty || control.touched || this.submitted));
  }

  protected triggerFileInput(id: string): void {
    (document.getElementById(id) as HTMLInputElement | null)?.click();
  }

  get name() {
    return this.signupForm.get('name');
  }
  get email() {
    return this.signupForm.get('email');
  }
  get phone() {
    return this.signupForm.get('phone');
  }
  get password() {
    return this.signupForm.get('password');
  }
  get confirmPassword() {
    return this.signupForm.get('confirmPassword');
  }
  get logo() {
    return this.signupForm.get('logo');
  }
  get alias() {
    return this.signupForm.get('alias');
  }
  get size() {
    return this.signupForm.get('size');
  }
  get group_link() {
    return this.signupForm.get('group_link');
  }
  get slot_in_a_month() {
    return this.signupForm.get('slot_in_a_month');
  }
  get description() {
    return this.signupForm.get('description');
  }
  get profile_picture() {
    return this.signupForm.get('profile_picture');
  }

  protected onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      this.clearLogo();
      return;
    }
    this.selectedLogoFile = file;
    this.signupForm.patchValue({ logo: file });
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  protected clearLogo(): void {
    this.selectedLogoFile = null;
    this.logoPreview = null;
    this.signupForm.patchValue({ logo: null });
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  protected onProfileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      this.clearProfile();
      return;
    }
    this.selectedProfileFile = file;
    this.signupForm.patchValue({ profile_picture: file });
    const reader = new FileReader();
    reader.onload = () => {
      this.profilePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  protected clearProfile(): void {
    this.selectedProfileFile = null;
    this.profilePreview = null;
    this.signupForm.patchValue({ profile_picture: null });
    const fileInput = document.getElementById('profile_picture') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  /** Build FormData from form value, role, and file inputs (logo / profile_picture). */
  private buildSignupFormData(): FormData {
    const value = { ...this.signupForm.value };
    delete value.confirmPassword;

    if (this.type === ENTITY_TYPES.COMPANY) {
      value.role = ENTITY_TYPE_IDS.COMPANY;
      value.logo = this.selectedLogoFile ?? value.logo;
    } else if (this.type === ENTITY_TYPES.MEDIATOR) {
      value.role = ENTITY_TYPE_IDS.MEDIATOR;
      value.profile_picture = this.selectedProfileFile ?? value.profile_picture;
    } else {
      value.role = ENTITY_TYPE_IDS.USER;
    }

    const formData = new FormData();
    //console.log('Value', value);
    for (const [key, val] of Object.entries(value) as [string, any | File | null | undefined][]) {
      //console.log('Key', key, 'Value', val);
      //if (val == null || val === '') continue;
      // if (val instanceof File) {
      //   formData.append(key, val, val.name);
      // } else {
        formData.append(key, val);
      //}
    }
    //console.log('Form data', formData);
    return formData;
  }

  protected onSubmit(): void {
    this.submitted = true;
    this.submitError = null;

    if (!this.signupForm.valid) {
      return;
    }

    this.isSubmitting = true;
    const formData = this.buildSignupFormData();

    this.apiservice.signup(formData).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (this.isSignupSuccessful(res)) {
          this.submitted = false;
          const isCompanySignup = this.type === ENTITY_TYPES.COMPANY;
          this.hasSignupSession = this.persistSignupSession(res, isCompanySignup);
          this.openSuccessOverlay(isCompanySignup);
          this.cdr.detectChanges();
          return;
        }

        this.submitError = res?.message || 'Unable to create account. Please try again.';
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSubmitting = false;
        this.submitted = false;
        this.submitError = 'Unable to create account. Please check your details and try again.';
        this.cdr.detectChanges();
      },
    });
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  /** Close success overlay and navigate to login or dashboard. */
  protected completeSignupFlow(): void {
    const navigateToDashboard = this.hasSignupSession;
    this.closeSuccessOverlay();
    this.router.navigate([navigateToDashboard ? '/dashboard' : '/login']);
  }

  /** @deprecated Use completeSignupFlow — kept for template compatibility. */
  protected goToLogin(): void {
    this.completeSignupFlow();
  }

  private openSuccessOverlay(isCompanyPending: boolean): void {
    this.isCompanyPendingOverlay = isCompanyPending;
    this.showSuccessOverlay = true;
    this.setBodyScrollLocked(true);
  }

  private closeSuccessOverlay(): void {
    this.showSuccessOverlay = false;
    this.isCompanyPendingOverlay = false;
    this.hasSignupSession = false;
    this.setBodyScrollLocked(false);
  }

  private isSignupSuccessful(res: any): boolean {
    if (!res) {
      return false;
    }

    if (res.success === true || res.success === 1 || res.success === 'true') {
      return true;
    }

    if (res.status === true || res.status === 'success') {
      return true;
    }

    return Boolean(res.data?.token);
  }

  private persistSignupSession(res: any, forceUserRole: boolean): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const data = res?.data;
    const token = data?.token;
    if (!token) {
      return false;
    }

    localStorage.setItem(STORAGE_KEYS.TOKEN_OBJ, JSON.stringify(data));
    if (forceUserRole) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, JSON.stringify(ENTITY_TYPE_IDS.USER));
    } else if (data?.user?.default_role != null) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, JSON.stringify(data.user.default_role));
    }

    return true;
  }

  private setBodyScrollLocked(locked: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.body.style.overflow = locked ? 'hidden' : '';
  }
}
