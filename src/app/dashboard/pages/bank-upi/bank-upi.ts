import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apiservice } from '../../../../services/apiservice';
import { getTokenFromLocalStorage, STORAGE_KEYS } from '../../../../constants';

@Component({
  selector: 'app-bank-upi',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bank-upi.html',
  styleUrl: './bank-upi.css',
})
export class BankUpi implements OnInit {
  token: any = null;
  loading = false;
  saving = false;
  loadError = '';
  saveMessage = '';
  saveError = '';
  hasExistingBankDetails = false;
  payoutMethod: 'upi' | 'bank' = 'upi';

  bankForm: FormGroup;
  upiForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: Apiservice,
    private cdr: ChangeDetectorRef,
  ) {
    this.bankForm = this.fb.group({
      revo_bank_holder_name: ['', Validators.required],
      revo_user_bank_name: ['', Validators.required],
      revo_back_account_no: ['', [Validators.required, Validators.pattern(/^\d{9,18}$/)]],
      revo_bank_ifsc: ['', [Validators.required]],
    });

    this.upiForm = this.fb.group({
      revo_user_upi: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/)]],
      revo_upi_display_name: [''],
    });
  }

  ngOnInit(): void {
    this.token = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.token ?? null;
    this.loadBankUpi();
  }

  loadBankUpi(): void {
    if (!this.token) {
      this.loadError = 'Please log in to manage bank and UPI details.';
      return;
    }

    this.loading = true;
    this.loadError = '';
    this.apiService.getBankUpi(this.token).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.hasExistingBankDetails = this.hasBankData(data);
        this.bankForm.patchValue({
          revo_bank_holder_name: data.revo_bank_holder_name ?? data.accountHolderName ?? '',
          revo_user_bank_name: data.revo_user_bank_name ?? data.bankName ?? '',
          revo_back_account_no: data.revo_back_account_no ?? data.accountNumber ?? '',
          revo_bank_ifsc: data.revo_bank_ifsc ?? data.ifscCode ?? '',
        });
        this.upiForm.patchValue({
          revo_user_upi: data.revo_user_upi ?? data.upiId ?? '',
          revo_upi_display_name: data.revo_upi_display_name ?? data.upiName ?? '',
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        if (err?.status !== 404) {
          this.loadError = err?.error?.message ?? 'Failed to load bank and UPI details.';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  saveBankDetails(): void {
    if (this.bankForm.invalid) {
      this.bankForm.markAllAsTouched();
      return;
    }
    this.saveDetails({ ...this.bankForm.value, ...this.upiForm.value }, 'bank');
  }

  saveUpiDetails(): void {
    if (this.upiForm.invalid) {
      this.upiForm.markAllAsTouched();
      return;
    }
    this.saveDetails({ ...this.bankForm.value, ...this.upiForm.value }, 'upi');
  }

  setPayoutMethod(value: string): void {
    this.payoutMethod = value === 'bank' ? 'bank' : 'upi';
  }

  addPayoutMethod(): void {
    if (this.payoutMethod === 'bank') {
      this.saveBankDetails();
      return;
    }
    this.saveUpiDetails();
  }

  get savedMethods(): Array<{ kind: 'bank' | 'upi'; title: string; subtitle: string; primary: boolean }> {
    const methods: Array<{ kind: 'bank' | 'upi'; title: string; subtitle: string; primary: boolean }> = [];
    const bank = this.bankForm.getRawValue();
    const upi = this.upiForm.getRawValue();
    const hasBank = !!(bank.revo_user_bank_name || bank.revo_back_account_no);
    const hasUpi = !!upi.revo_user_upi;

    if (hasBank) {
      const bankName = bank.revo_user_bank_name || 'Bank account';
      methods.push({
        kind: 'bank',
        title: `${bankName} ${this.maskAccount(bank.revo_back_account_no)}`.trim(),
        subtitle: bank.revo_bank_holder_name || 'Bank payout',
        primary: true,
      });
    }

    if (hasUpi) {
      methods.push({
        kind: 'upi',
        title: upi.revo_user_upi,
        subtitle: upi.revo_upi_display_name || 'UPI payout',
        primary: !hasBank,
      });
    }

    return methods;
  }

  private maskAccount(account: string): string {
    const digits = String(account || '').replace(/\D/g, '');
    if (!digits) {
      return '';
    }
    return `···· ${digits.slice(-4)}`;
  }

  saveAll(): void {
    if (this.bankForm.invalid || this.upiForm.invalid) {
      this.bankForm.markAllAsTouched();
      this.upiForm.markAllAsTouched();
      return;
    }
    this.saveDetails({ ...this.bankForm.value, ...this.upiForm.value }, 'all');
  }

  private hasBankData(data: any): boolean {
    return !!(
      data?.id ||
      data?.revo_back_account_no ||
      data?.revo_bank_holder_name ||
      data?.revo_user_bank_name ||
      data?.revo_bank_ifsc
    );
  }

  private saveDetails(payload: Record<string, string>, scope: 'bank' | 'upi' | 'all'): void {
    if (!this.token) {
      return;
    }

    this.saving = true;
    this.saveMessage = '';
    this.saveError = '';

    const shouldUpdate = this.hasExistingBankDetails;

    const request$ = shouldUpdate
      ? this.apiService.updateBankUpi(this.token, payload)
      : this.apiService.saveBankUpi(this.token, payload);

    request$.subscribe({
      next: () => {
        if (scope === 'bank' || scope === 'all' || this.hasBankData(payload)) {
          this.hasExistingBankDetails = true;
        }
        this.saveMessage =
          shouldUpdate
            ? 'Bank and UPI details updated successfully.'
            : 'Bank and UPI details saved successfully.';
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.saveError = err?.error?.message ?? 'Failed to save bank and UPI details.';
        this.saving = false;
        this.cdr.detectChanges();
      },
    });
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
