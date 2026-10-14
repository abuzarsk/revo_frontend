import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ENTITY_TYPE_IDS } from '../../../../constants';
import { readRoleId } from '../member/member-role';

type TaskStatus = 'submitted' | 'under_review' | 'rejected';

interface TaskRow {
  id: string;
  member: string;
  company: string;
  status: TaskStatus;
  updatedAt: string;
}

const REVIEW: TaskStatus[] = ['submitted', 'under_review', 'rejected'];
const MEMBERS = ['Dinesh G', 'Priya S', 'Arjun K', 'Maya R', 'Rohan M'];
const CYCLE = ['submitted', 'under_review', 'approved', 'rejected', 'paid'] as const;

function iso(daysAgo: number): string {
  const date = new Date(Date.UTC(2026, 8, 29, 10));
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString();
}

function buildTasks(): TaskRow[] {
  const rows: TaskRow[] = [
    { id: 'SUB-1042', member: 'Dinesh G', company: 'Company Alpha', status: 'under_review', updatedAt: iso(2) },
    { id: 'SUB-1041', member: 'Priya S', company: 'Company Alpha', status: 'submitted', updatedAt: iso(1) },
    { id: 'SUB-1036', member: 'Dinesh G', company: 'Nova Retail', status: 'rejected', updatedAt: iso(7) },
  ];
  const products = [
    { code: 'P1', company: 'Company Alpha', start: 2 },
    { code: 'P2', company: 'Company Alpha', start: 2 },
    { code: 'P3', company: 'Nova Retail', start: 1 },
    { code: 'P4', company: 'Urban Labs', start: 0 },
    { code: 'P5', company: 'Nova Retail', start: 0 },
    { code: 'P6', company: 'Company Alpha', start: 0 },
  ];
  for (const product of products) {
    for (let index = product.start; index < 20; index += 1) {
      const status = CYCLE[index % CYCLE.length];
      if (!REVIEW.includes(status as TaskStatus)) {
        continue;
      }
      rows.push({
        id: `SAMPLE-${product.code}-${String(index + 1).padStart(3, '0')}`,
        member: MEMBERS[index % MEMBERS.length],
        company: product.company,
        status: status as TaskStatus,
        updatedAt: iso(index % 25),
      });
    }
  }
  return rows;
}

@Component({
  selector: 'app-mediator-tasks',
  imports: [CommonModule],
  templateUrl: './mediator-tasks.html',
  styleUrl: './mediator-tasks.css',
})
export class MediatorTasks implements OnInit {
  readonly tasks: TaskRow[] = buildTasks();

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (readRoleId() !== ENTITY_TYPE_IDS.MEDIATOR) {
      this.router.navigateByUrl('/');
    }
  }

  get needsVerification(): number {
    return this.tasks.filter((item) => item.status === 'submitted').length;
  }

  get inReview(): number {
    return this.tasks.filter((item) => item.status === 'under_review').length;
  }

  get needsFollowUp(): number {
    return this.tasks.filter((item) => item.status === 'rejected').length;
  }

  statusLabel(status: TaskStatus): string {
    return status.replace('_', ' ');
  }

  openQueue(): void {
    this.router.navigateByUrl('/partner-submissions');
  }
}
