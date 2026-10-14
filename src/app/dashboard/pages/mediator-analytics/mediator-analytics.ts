import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ENTITY_TYPE_IDS } from '../../../../constants';
import { readRoleId } from '../member/member-role';

type Metric = 'earnings' | 'submissions';

@Component({
  selector: 'app-mediator-analytics',
  imports: [CommonModule],
  templateUrl: './mediator-analytics.html',
  styleUrl: './mediator-analytics.css',
})
export class MediatorAnalytics implements OnInit {
  readonly months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  readonly earnings = [18200, 21400, 19800, 24600, 26100, 29800, 27400, 33400, 36100, 40200, 44100, 48650];
  readonly submissions = [62, 74, 70, 88, 94, 108, 101, 122, 131, 148, 166, 184];
  readonly companies = [
    { label: 'Company Alpha', value: 44 },
    { label: 'Nova Retail', value: 27 },
    { label: 'Urban Labs', value: 17 },
    { label: 'Glow Partners', value: 12 },
  ];
  readonly products = [
    { label: 'Smart Watch', value: 96 },
    { label: 'Wireless Headphone', value: 88 },
    { label: 'Power Bank', value: 74 },
    { label: 'Bluetooth Speaker', value: 61 },
  ];

  metric: Metric = 'earnings';
  selected = 11;

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (readRoleId() !== ENTITY_TYPE_IDS.MEDIATOR) {
      this.router.navigateByUrl('/');
    }
  }

  get values(): number[] {
    return this.metric === 'earnings' ? this.earnings : this.submissions;
  }

  get max(): number {
    return Math.max(...this.values);
  }

  get display(): string {
    const value = this.values[this.selected] ?? 0;
    return this.metric === 'earnings' ? this.inr(value) : value.toLocaleString('en-IN');
  }

  barHeight(value: number): string {
    return `${Math.max(12, (value / this.max) * 100)}%`;
  }

  setMetric(metric: Metric): void {
    this.metric = metric;
    this.selected = 11;
  }

  selectMonth(index: number): void {
    this.selected = index;
  }

  barLabel(index: number): string {
    const value = this.values[index] ?? 0;
    const amount = this.metric === 'earnings' ? this.inr(value) : String(value);
    return `${this.months[index]}: ${amount} ${this.metric}`;
  }

  private inr(value: number): string {
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
  }
}
