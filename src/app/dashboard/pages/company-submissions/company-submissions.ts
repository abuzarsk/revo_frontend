import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type SubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';

@Component({
  selector: 'app-company-submissions',
  imports: [CommonModule, FormsModule],
  templateUrl: './company-submissions.html',
  styleUrls: ['../company-portal/company-portal.css'],
})
export class CompanySubmissions {
  query = '';
  statusFilter: 'all' | 'action' | SubmissionStatus = 'all';
  productFilter = 'all';

  readonly statuses: { key: SubmissionStatus; label: string; badge: string }[] = [
    { key: 'submitted', label: 'Submitted', badge: 'cp-badge--submitted' },
    { key: 'under_review', label: 'In review', badge: 'cp-badge--review' },
    { key: 'approved', label: 'Approved', badge: 'cp-badge--approved' },
    { key: 'rejected', label: 'Rejected', badge: 'cp-badge--rejected' },
    { key: 'paid', label: 'Paid', badge: 'cp-badge--paid' },
  ];

  countFor(_key: SubmissionStatus): number {
    return 0;
  }

  setStatus(key: 'all' | 'action' | SubmissionStatus): void {
    this.statusFilter = this.statusFilter === key ? 'all' : key;
  }
}
