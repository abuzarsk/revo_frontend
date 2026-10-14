import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ENTITY_TYPE_IDS } from '../../../../constants';
import { readRoleId } from '../member/member-role';

type SubStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
type Actor = 'member' | 'mediator' | 'company';
type FieldType = 'text' | 'date' | 'number' | 'url' | 'checkbox' | 'select' | 'textarea';

interface Field {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  maxLength?: number;
}

interface Product {
  id: string;
  name: string;
  icon: string;
  company: string;
  price: number;
  formId: 'order' | 'review';
  status: 'active' | 'paused' | 'archived';
}

interface HistoryEntry {
  at: string;
  by: Actor;
  from: SubStatus | null;
  to: SubStatus;
  note?: string;
}

interface Submission {
  id: string;
  productId: string;
  member: string;
  company: string;
  status: SubStatus;
  answers: Record<string, string | boolean>;
  history: HistoryEntry[];
  updatedAt: string;
}

interface Transition {
  to: SubStatus;
  label: string;
  needsNote?: boolean;
  danger?: boolean;
}

const MEDIATOR_COMPANIES = ['Company Alpha', 'Nova Retail'];
const SAMPLE_PER_PRODUCT = 20;
const SAMPLE_MEMBERS = ['Dinesh G', 'Priya S', 'Arjun K', 'Maya R', 'Rohan M'];
const STATUS_ORDER: SubStatus[] = ['submitted', 'under_review', 'approved', 'rejected', 'paid'];
const STATUS_PATH: Record<SubStatus, SubStatus[]> = {
  submitted: ['submitted'],
  under_review: ['submitted', 'under_review'],
  approved: ['submitted', 'under_review', 'approved'],
  rejected: ['submitted', 'under_review', 'rejected'],
  paid: ['submitted', 'under_review', 'approved', 'paid'],
};
const ACTOR_LABEL: Record<Actor, string> = {
  member: 'Member',
  mediator: 'Mediator',
  company: 'Company',
};

const ORDER_FIELDS: Field[] = [
  { id: 'order_id', label: 'Order ID', type: 'text', required: true, placeholder: 'e.g. 402-1234567' },
  { id: 'order_date', label: 'Order date', type: 'date', required: true },
  { id: 'amount', label: 'Amount paid (₹)', type: 'number', required: true, min: 1, max: 200000 },
  { id: 'screenshot', label: 'Order screenshot link', type: 'url', required: true, placeholder: 'https://' },
  { id: 'consent', label: 'I confirm these details are accurate', type: 'checkbox', required: true },
];
const REVIEW_FIELDS: Field[] = [
  { id: 'order_id', label: 'Order ID', type: 'text', required: true },
  { id: 'rating', label: 'Rating', type: 'select', required: true, options: ['5', '4', '3', '2', '1'] },
  { id: 'review_link', label: 'Review link', type: 'url', required: true, placeholder: 'https://' },
  { id: 'notes', label: 'Notes for the brand', type: 'textarea', required: false, maxLength: 500 },
];

const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Wireless Headphone', icon: '🎧', company: 'Company Alpha', price: 1999, formId: 'review', status: 'active' },
  { id: 'p2', name: 'Smart Watch', icon: '⌚', company: 'Company Alpha', price: 2499, formId: 'order', status: 'active' },
  { id: 'p3', name: 'Power Bank 20000mAh', icon: '🔋', company: 'Nova Retail', price: 1299, formId: 'order', status: 'active' },
  { id: 'p5', name: 'Running Shoes', icon: '👟', company: 'Nova Retail', price: 3299, formId: 'order', status: 'paused' },
  { id: 'p6', name: 'Desk Lamp', icon: '💡', company: 'Company Alpha', price: 899, formId: 'order', status: 'archived' },
];

function day(offset: number): string {
  return new Date(Date.UTC(2026, 8, 29 - offset, 10)).toISOString();
}

function makeSubmission(
  id: string,
  productId: string,
  member: string,
  company: string,
  status: SubStatus,
  path: SubStatus[],
  offset: number,
  answers: Record<string, string | boolean>,
): Submission {
  const history: HistoryEntry[] = path.map((to, index) => ({
    at: day(offset - index * 0.3),
    by: to === 'submitted' ? 'member' : to === 'under_review' ? 'mediator' : 'company',
    from: index ? path[index - 1] : null,
    to,
    note: to === 'rejected' ? 'Screenshot does not show order ID.' : undefined,
  }));
  return {
    id,
    productId,
    member,
    company,
    status,
    answers,
    history,
    updatedAt: history[history.length - 1].at,
  };
}

function sampleAnswers(product: Product, index: number): Record<string, string | boolean> {
  const fields = product.formId === 'review' ? REVIEW_FIELDS : ORDER_FIELDS;
  const answers: Record<string, string | boolean> = {};
  fields.forEach((field) => {
    if (field.type === 'checkbox') {
      answers[field.id] = true;
      return;
    }
    if (field.type === 'select') {
      const options = field.options ?? [];
      answers[field.id] = options[index % (options.length || 1)] ?? '';
      return;
    }
    if (field.type === 'number') {
      const low = field.min ?? 1;
      const high = field.max ?? 200000;
      answers[field.id] = String(Math.min(high, Math.max(low, product.price)));
      return;
    }
    if (field.type === 'date') {
      answers[field.id] = new Date(Date.UTC(2026, 8, 28 - (index % 20))).toISOString().slice(0, 10);
      return;
    }
    if (field.type === 'url') {
      answers[field.id] = `https://example.com/sample/${product.id}/${index + 1}`;
      return;
    }
    const value =
      field.id === 'order_id'
        ? `ORD-${product.id.toUpperCase()}-${String(index + 1).padStart(3, '0')}`
        : field.type === 'textarea'
          ? `Sample proof for ${product.name}.`
          : `Sample ${field.label} ${index + 1}`;
    answers[field.id] = value.slice(0, field.maxLength ?? 2000);
  });
  return answers;
}

export function buildMediatorSubmissions(): Submission[] {
  const submissions: Submission[] = [
    makeSubmission('SUB-1042', 'p1', 'Dinesh G', 'Company Alpha', 'under_review', ['submitted', 'under_review'], 2, {
      order_id: '402-8812345',
      rating: '5',
      review_link: 'https://amazon.in/review/1',
    }),
    makeSubmission('SUB-1039', 'p2', 'Dinesh G', 'Company Alpha', 'approved', ['submitted', 'under_review', 'approved'], 5, {
      order_id: 'OD4411223',
      order_date: '2026-09-20',
      amount: '2499',
      screenshot: 'https://img.example/1',
      consent: true,
    }),
    makeSubmission('SUB-1036', 'p3', 'Dinesh G', 'Nova Retail', 'rejected', ['submitted', 'under_review', 'rejected'], 7, {
      order_id: '402-7700112',
      order_date: '2026-09-15',
      amount: '1299',
      screenshot: 'https://img.example/2',
      consent: true,
    }),
    makeSubmission('SUB-1041', 'p1', 'Priya S', 'Company Alpha', 'submitted', ['submitted'], 1, {
      order_id: '402-5551234',
      rating: '4',
      review_link: 'https://amazon.in/review/2',
    }),
    makeSubmission('SUB-1033', 'p2', 'Arjun K', 'Company Alpha', 'paid', ['submitted', 'under_review', 'approved', 'paid'], 10, {
      order_id: 'OD1100',
      order_date: '2026-09-10',
      amount: '2499',
      screenshot: 'https://img.example/3',
      consent: true,
    }),
  ];
  const used = new Set(submissions.map((item) => item.id));
  for (const product of PRODUCTS) {
    let count = submissions.filter((item) => item.productId === product.id).length;
    for (let index = count; count < SAMPLE_PER_PRODUCT; index += 1) {
      const status = STATUS_ORDER[index % STATUS_ORDER.length];
      let id = `SAMPLE-${product.id.toUpperCase()}-${String(index + 1).padStart(3, '0')}`;
      while (used.has(id)) {
        id = `${id}-NEW`;
      }
      used.add(id);
      submissions.push(
        makeSubmission(
          id,
          product.id,
          SAMPLE_MEMBERS[index % SAMPLE_MEMBERS.length],
          product.company,
          status,
          STATUS_PATH[status],
          index % 25,
          sampleAnswers(product, index),
        ),
      );
      count += 1;
    }
  }
  return submissions.filter((item) => MEDIATOR_COMPANIES.includes(item.company));
}

@Component({
  selector: 'app-mediator-submissions',
  imports: [CommonModule, FormsModule],
  templateUrl: './mediator-submissions.html',
  styleUrl: './mediator-submissions.css',
})
export class MediatorSubmissions implements OnInit {
  readonly statuses: { key: SubStatus; label: string }[] = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Under review' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'paid', label: 'Refund paid' },
  ];

  submissions: Submission[] = buildMediatorSubmissions();
  query = '';
  statusFilter: SubStatus | 'all' | 'action' = 'all';
  productFilter = 'all';
  openId: string | null = null;
  pending: Transition | null = null;
  note = '';
  feedback = '';

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (readRoleId() !== ENTITY_TYPE_IDS.MEDIATOR) {
      this.router.navigateByUrl('/');
    }
  }

  get productOptions(): Product[] {
    return PRODUCTS.filter((product) => product.status !== 'archived' && MEDIATOR_COMPANIES.includes(product.company));
  }

  get hasSamples(): boolean {
    return this.scoped.some((item) => item.id.startsWith('SAMPLE-'));
  }

  get scoped(): Submission[] {
    if (this.productFilter === 'all') {
      return this.submissions;
    }
    return this.submissions.filter((item) => item.productId === this.productFilter);
  }

  get rows(): Submission[] {
    const query = this.query.trim().toLowerCase();
    return this.scoped
      .filter((item) => {
        if (this.statusFilter === 'all') {
          return true;
        }
        if (this.statusFilter === 'action') {
          return this.needsAction(item);
        }
        return item.status === this.statusFilter;
      })
      .filter((item) => {
        if (!query) {
          return true;
        }
        const product = this.productName(item.productId);
        return `${item.id} ${item.member} ${item.company} ${product}`.toLowerCase().includes(query);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get open(): Submission | null {
    return this.scoped.find((item) => item.id === this.openId) ?? null;
  }

  get selectedProductName(): string {
    return this.productName(this.productFilter);
  }

  countFor(status: SubStatus): number {
    return this.scoped.filter((item) => item.status === status).length;
  }

  productName(id: string): string {
    return PRODUCTS.find((product) => product.id === id)?.name ?? 'Removed product';
  }

  productIcon(id: string): string {
    return PRODUCTS.find((product) => product.id === id)?.icon ?? '';
  }

  fieldsFor(submission: Submission): Field[] {
    const product = PRODUCTS.find((item) => item.id === submission.productId);
    return product?.formId === 'review' ? REVIEW_FIELDS : ORDER_FIELDS;
  }

  fieldValue(submission: Submission, field: Field): string {
    const value = submission.answers[field.id];
    return typeof value === 'string' ? value : '';
  }

  fieldChecked(submission: Submission, field: Field): boolean {
    return submission.answers[field.id] === true;
  }

  needsAction(submission: Submission): boolean {
    return submission.status === 'submitted';
  }

  actionsFor(submission: Submission): Transition[] {
    if (submission.status !== 'submitted') {
      return [];
    }
    return [
      { to: 'under_review', label: 'Verify & forward' },
      { to: 'rejected', label: 'Reject', needsNote: true, danger: true },
    ];
  }

  historyFor(submission: Submission): HistoryEntry[] {
    return [...submission.history].reverse();
  }

  historyLine(entry: HistoryEntry): string {
    const change = entry.from ? `${this.labelFor(entry.from)} → ${this.labelFor(entry.to)}` : 'Created';
    return `${change} by ${ACTOR_LABEL[entry.by]}`;
  }

  labelFor(status: SubStatus): string {
    return this.statuses.find((item) => item.key === status)?.label ?? status;
  }

  formatWhen(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  setStatus(status: SubStatus): void {
    this.statusFilter = this.statusFilter === status ? 'all' : status;
  }

  clearProduct(): void {
    this.productFilter = 'all';
  }

  openRow(submission: Submission): void {
    this.openId = submission.id;
    this.pending = null;
    this.note = '';
    this.feedback = '';
  }

  closeDetail(): void {
    this.openId = null;
    this.pending = null;
    this.note = '';
    this.feedback = '';
  }

  begin(transition: Transition): void {
    this.feedback = '';
    if (transition.needsNote) {
      this.pending = transition;
      return;
    }
    this.apply(transition);
  }

  confirm(): void {
    if (!this.pending) {
      return;
    }
    if (this.pending.needsNote && !this.note.trim()) {
      this.feedback = 'Please add a reason.';
      this.cdr.detectChanges();
      return;
    }
    this.apply(this.pending);
  }

  cancelPending(): void {
    this.pending = null;
    this.note = '';
    this.feedback = '';
  }

  onQuery(value: string): void {
    this.query = value.slice(0, 80);
  }

  private apply(transition: Transition): void {
    const current = this.open;
    if (!current) {
      return;
    }
    const at = new Date().toISOString();
    const note = this.note.trim().slice(0, 500);
    this.submissions = this.submissions.map((item) => {
      if (item.id !== current.id || item.status !== 'submitted') {
        return item;
      }
      return {
        ...item,
        status: transition.to,
        updatedAt: at,
        history: [
          ...item.history,
          {
            at,
            by: 'mediator' as const,
            from: item.status,
            to: transition.to,
            note: note || undefined,
          },
        ],
      };
    });
    this.pending = null;
    this.note = '';
    this.feedback = `${current.id}: ${this.labelFor(transition.to)}.`;
    this.cdr.detectChanges();
  }
}
