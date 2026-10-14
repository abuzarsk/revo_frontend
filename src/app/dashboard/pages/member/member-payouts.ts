import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Apiservice } from '../../../../services/apiservice';
import { getTokenFromLocalStorage, STORAGE_KEYS } from '../../../../constants';
import { parsePaginatedResponse } from '../products/products-pagination.model';
import { ensureWorkspaceRole, readRoleId, readStoredJson, workspaceLabel, writeStoredJson } from './member-role';
import { ENTITY_TYPE_IDS } from '../../../../constants';

type Cadence = 'weekly' | 'biweekly' | 'monthly';
type LedgerType = 'all' | 'credit' | 'debit';

interface LedgerRow {
  id: string;
  at: string;
  description: string;
  counterparty: string;
  type: 'credit' | 'debit';
  amount: number;
  status: string;
}

const CADENCE_KEY = 'revo-payout-cadence-member-v1';
const CADENCE_LABEL: Record<Cadence, string> = {
  weekly: 'Every Monday',
  biweekly: 'Every other Monday',
  monthly: '1st of each month',
};

@Component({
  selector: 'app-member-payouts',
  imports: [CommonModule, FormsModule],
  templateUrl: './member-payouts.html',
  styleUrl: './member.css',
})
export class MemberPayouts implements OnInit {
  rows: LedgerRow[] = [];
  query = '';
  type: LedgerType = 'all';
  cadence: Cadence = 'monthly';
  loading = false;
  error = '';
  notice = '';
  readonly cadenceOptions: Cadence[] = ['weekly', 'biweekly', 'monthly'];
  readonly cadenceLabel = CADENCE_LABEL;

  constructor(
    private router: Router,
    private api: Apiservice,
    private cdr: ChangeDetectorRef,
  ) {}

  get lede(): string {
    return `Payouts in ${workspaceLabel()}`;
  }

  ngOnInit(): void {
    if (!ensureWorkspaceRole(this.router)) {
      return;
    }
    const stored = readStoredJson(this.cadenceKey(), { cadence: 'monthly' as Cadence });
    this.cadence = stored.cadence || 'monthly';
    if (readRoleId() === ENTITY_TYPE_IDS.COMPANY) {
      return;
    }
    const token = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.token ?? null;
    this.loading = true;
    this.api.getUserOrderHistory(token, 1, 50, { status: 'paid' }).subscribe({
      next: (res: unknown) => {
        const parsed = parsePaginatedResponse(res, 1);
        this.rows = parsed.items
          .map((item) => this.mapRow(item as Record<string, unknown>))
          .filter((row) => row.amount > 0 || row.description !== 'Payout');
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = 'Payout history could not be loaded.';
        this.cdr.detectChanges();
      },
    });
  }

  get filtered(): LedgerRow[] {
    const query = this.query.trim().toLowerCase();
    return this.rows.filter((row) => {
      const typeOk = this.type === 'all' || row.type === this.type;
      const text = `${row.id} ${row.description} ${row.counterparty}`.toLowerCase();
      return typeOk && (!query || text.includes(query));
    });
  }

  get lifetime(): number {
    return this.rows
      .filter((row) => row.type === 'credit' && this.isDone(row.status))
      .reduce((sum, row) => sum + row.amount, 0);
  }

  get pending(): number {
    return this.rows
      .filter((row) => row.type === 'credit' && !this.isDone(row.status))
      .reduce((sum, row) => sum + row.amount, 0);
  }

  get available(): number {
    return this.lifetime;
  }

  get nextPayout(): string {
    const date = new Date();
    if (this.cadence === 'monthly') {
      return new Date(date.getFullYear(), date.getMonth() + 1, 1).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }
    const extra = this.cadence === 'biweekly' ? 7 : 0;
    const add = ((8 - date.getDay()) % 7 || 7) + extra;
    date.setDate(date.getDate() + add);
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  inr(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  setCadence(value: Cadence): void {
    this.cadence = value;
    writeStoredJson(this.cadenceKey(), { cadence: value });
    this.notice = `Payout schedule saved in this browser. ${CADENCE_LABEL[value]}.`;
  }

  requestPayout(): void {
    this.notice = 'Payout requests are not connected yet. Your paid orders stay listed below.';
  }

  clearFilters(): void {
    this.query = '';
    this.type = 'all';
  }

  badgeClass(status: string): string {
    const key = status.toLowerCase();
    if (key.includes('fail') || key.includes('reject') || key.includes('cancel')) {
      return 'pay-badge--failed';
    }
    if (key.includes('pend') || key.includes('review') || key.includes('process')) {
      return 'pay-badge--pending';
    }
    if (key.includes('paid') || key.includes('complete') || key.includes('approv')) {
      return 'pay-badge--done';
    }
    return '';
  }

  downloadInvoice(row: LedgerRow): void {
    const when = row.at ? new Date(row.at).toLocaleDateString('en-IN') : '';
    const html = `<!doctype html><meta charset="utf-8"><title>${row.id}</title><body style="font-family:sans-serif;max-width:560px;margin:40px auto"><h1>Revo invoice ${row.id}</h1><p>Date: ${when}</p><p>Description: ${row.description}</p><p>Counterparty: ${row.counterparty}</p><p>Type: ${row.type}</p><h2>Amount: ${this.inr(row.amount)}</h2><p>Status: ${row.status}</p></body>`;
    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${row.id}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
    this.notice = `Invoice ${row.id} downloaded.`;
  }

  exportCsv(): void {
    if (!this.filtered.length) {
      this.notice = 'Nothing to export.';
      return;
    }
    const lines = [
      ['Reference', 'Date', 'Description', 'Counterparty', 'Type', 'Amount', 'Status'],
      ...this.filtered.map((row) => [
        row.id,
        row.at,
        row.description,
        row.counterparty,
        row.type,
        String(row.amount),
        row.status,
      ]),
    ];
    const csv = lines.map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'member-payouts.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private cadenceKey(): string {
    return readRoleId() === ENTITY_TYPE_IDS.COMPANY ? 'revo-payout-cadence-company-v1' : CADENCE_KEY;
  }

  private isDone(status: string): boolean {
    const key = status.toLowerCase();
    return key.includes('paid') || key.includes('complete') || key.includes('approv');
  }

  private mapRow(raw: Record<string, unknown>): LedgerRow {
    const record = (raw['submission'] as Record<string, unknown>) || raw;
    const product = (raw['product'] as Record<string, unknown>) || {};
    const amount = this.readAmount(record, product, raw);
    const when = String(record['updated_at'] ?? record['created_at'] ?? raw['created_at'] ?? '');
    const parsed = new Date(when);
    return {
      id: String(record['id'] ?? raw['id'] ?? 'Payout'),
      at: Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString(),
      description: String(product['name'] ?? record['product_name'] ?? raw['product_name'] ?? 'Paid order'),
      counterparty: String(record['company_name'] ?? raw['company_name'] ?? 'Brand'),
      type: 'credit',
      amount,
      status: String(record['status_label'] ?? record['status'] ?? raw['status'] ?? 'paid').replaceAll('_', ' '),
    };
  }

  private readAmount(...sources: Record<string, unknown>[]): number {
    const keys = ['amount', 'price', 'paid_amount', 'order_amount', 'product_price', 'refund_amount'];
    for (const source of sources) {
      for (const key of keys) {
        const value = Number(source[key]);
        if (Number.isFinite(value) && value > 0) {
          return value;
        }
      }
    }
    return 0;
  }
}
