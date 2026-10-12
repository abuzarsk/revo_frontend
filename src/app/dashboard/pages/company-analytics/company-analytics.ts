import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Metric = 'submissions' | 'orders' | 'refunds';
type Listing = 'active' | 'archived';

interface StatusSlice {
  key: string;
  label: string;
  count: number;
}

interface ProductRow {
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
}

@Component({
  selector: 'app-company-analytics',
  imports: [CommonModule, FormsModule],
  templateUrl: './company-analytics.html',
  styleUrls: ['../company-portal/company-portal.css'],
})
export class CompanyAnalytics {
  period = 'all';
  metric: Metric = 'submissions';

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

  private readonly statusWeights = [
    { key: 'submitted', label: 'Submitted', count: 14 },
    { key: 'under_review', label: 'In review', count: 12 },
    { key: 'approved', label: 'Approved', count: 16 },
    { key: 'paid', label: 'Paid', count: 10 },
    { key: 'rejected', label: 'Rejected', count: 8 },
  ];

  private readonly productSeed: ProductRow[] = [
    { name: 'Wireless Headphone', brand: 'boAt', listing: 'active', submissions: 22, rate: 82, value: 119940 },
    { name: 'Smart Watch', brand: 'Noise', listing: 'active', submissions: 20, rate: 75, value: 74970 },
    { name: 'Desk Lamp', brand: 'Lumo', listing: 'archived', submissions: 18, rate: 61, value: 16182 },
  ];

  private readonly seriesShape = [6, 8, 7, 11, 9, 14, 12, 10, 16, 13, 18, 15];

  get stats(): { label: string; value: string; note: string; icon: string }[] {
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
        note: `${this.formatCount(this.accepted)} approved or paid`,
        icon: 'fa-check',
      },
      {
        label: 'Product listings',
        value: String(this.productSeed.length),
        note: `${this.productSeed.filter((item) => item.listing === 'active').length} active`,
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
    return this.distribute(
      this.submissionTotal,
      this.statusWeights.map((item) => item.count),
    ).map((count, index) => ({ ...this.statusWeights[index], count }));
  }

  get products(): ProductRow[] {
    const counts = this.distribute(
      this.submissionTotal,
      this.productSeed.map((item) => item.submissions),
    );
    return this.productSeed
      .map((item, index) => ({
        ...item,
        submissions: counts[index],
        value: this.scale(item.value),
      }))
      .sort((a, b) => b.submissions - a.submissions || b.value - a.value);
  }

  get buckets(): ChartBucket[] {
    const labels = this.bucketLabels();
    const shape = this.seriesShape.slice(-labels.length);
    const target =
      this.metric === 'submissions'
        ? this.submissionTotal
        : this.metric === 'orders'
          ? this.orderValue
          : this.refundValue;
    const values = this.distribute(target, shape);
    return labels.map((label, index) => ({ label, value: values[index] }));
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
    const base = this.statusWeights.reduce((sum, item) => sum + item.count, 0);
    return this.scale(base);
  }

  get pendingReview(): number {
    return this.statuses
      .filter((item) => item.key === 'submitted' || item.key === 'under_review')
      .reduce((sum, item) => sum + item.count, 0);
  }

  get accepted(): number {
    return this.statuses
      .filter((item) => item.key === 'approved' || item.key === 'paid')
      .reduce((sum, item) => sum + item.count, 0);
  }

  get approvalRate(): number {
    const reviewed = this.statuses
      .filter((item) => item.key !== 'submitted' && item.key !== 'under_review')
      .reduce((sum, item) => sum + item.count, 0);
    return reviewed ? Math.round((this.accepted / reviewed) * 100) : 0;
  }

  get orderCount(): number {
    return this.scale(48);
  }

  get orderValue(): number {
    return this.productSeed.reduce((sum, item) => sum + this.scale(item.value), 0);
  }

  get refundValue(): number {
    return this.scale(18400);
  }

  share(count: number): number {
    return this.submissionTotal ? Math.round((count / this.submissionTotal) * 100) : 0;
  }

  barHeight(value: number): number {
    const max = Math.max(1, ...this.buckets.map((bucket) => bucket.value));
    return Math.max(4, (value / max) * 100);
  }

  bucketLabel(value: number): string {
    if (this.metric === 'submissions') {
      return this.formatCount(value);
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `₹${Math.round(value / 1000)}k`;
    }
    return this.inr(value);
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
      ['Approved submissions', String(this.accepted), period],
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

  private formatCount(value: number): string {
    return value.toLocaleString('en-IN');
  }

  private scale(value: number): number {
    const factor = this.period === '30' ? 0.4 : this.period === '90' ? 0.65 : this.period === '365' ? 0.9 : 1;
    return Math.round(value * factor);
  }

  private bucketLabels(): string[] {
    const now = new Date();
    const monthly = this.period === '365' || this.period === 'all';
    const count = this.period === '30' ? 5 : this.period === '90' ? 6 : 12;
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(now);
      if (monthly) {
        date.setMonth(now.getMonth() - (count - index - 1), 1);
      } else {
        date.setDate(now.getDate() - (count - index - 1) * (this.period === '30' ? 6 : 15));
      }
      return monthly
        ? date.toLocaleDateString('en-GB', { month: 'short' })
        : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    });
  }

  private distribute(total: number, weights: number[]): number[] {
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    if (!weightSum || !weights.length) {
      return weights.map(() => 0);
    }
    const raw = weights.map((weight) => (weight / weightSum) * total);
    const counts = raw.map((value) => Math.floor(value));
    let remainder = total - counts.reduce((sum, value) => sum + value, 0);
    const order = raw
      .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
      .sort((a, b) => b.fraction - a.fraction);
    for (const item of order) {
      if (remainder <= 0) break;
      counts[item.index] += 1;
      remainder -= 1;
    }
    return counts;
  }
}
