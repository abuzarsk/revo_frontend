import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';

interface Campaign {
  id: string;
  name: string;
  channel: string;
  slots: number;
  filled: number;
  status: CampaignStatus;
  budget: number;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-company-campaigns',
  imports: [CommonModule, FormsModule],
  templateUrl: './company-campaigns.html',
  styleUrls: ['../company-portal/company-portal.css'],
})
export class CompanyCampaigns {
  campaigns: Campaign[] = [];

  get activeCount(): number {
    return this.campaigns.filter((item) => this.effectiveStatus(item) === 'active').length;
  }

  get filledSlots(): string {
    const filled = this.campaigns.reduce((sum, item) => sum + item.filled, 0);
    const slots = this.campaigns.reduce((sum, item) => sum + item.slots, 0);
    return `${filled} / ${slots}`;
  }

  get plannedBudget(): string {
    const total = this.campaigns.reduce((sum, item) => sum + item.budget, 0);
    return this.inr(total);
  }

  create(): void {
    const count = this.campaigns.length + 1;
    this.campaigns = [
      {
        id: `co-cmp-${Date.now()}`,
        name: `Untitled campaign ${count}`,
        channel: 'Member portal',
        slots: 50,
        filled: 0,
        status: 'draft',
        budget: 25000,
        startDate: this.shiftDate(1),
        endDate: this.shiftDate(31),
      },
      ...this.campaigns,
    ];
  }

  effectiveStatus(campaign: Campaign): CampaignStatus {
    if (campaign.status === 'paused' || campaign.status === 'completed' || campaign.status === 'draft') {
      return campaign.status;
    }
    const today = this.shiftDate(0);
    if (campaign.endDate && campaign.endDate < today) {
      return 'completed';
    }
    if (campaign.startDate && campaign.startDate > today) {
      return 'scheduled';
    }
    return 'active';
  }

  statusClass(campaign: Campaign): string {
    const status = this.effectiveStatus(campaign);
    if (status === 'active') return 'cp-badge--active';
    if (status === 'paused') return 'cp-badge--paused';
    if (status === 'completed') return 'cp-badge--paid';
    return 'cp-badge--muted';
  }

  actionLabel(campaign: Campaign): string {
    const status = this.effectiveStatus(campaign);
    if (status === 'active' || status === 'scheduled') return 'Pause';
    if (status === 'completed') return 'Schedule again';
    if (status === 'paused') return 'Resume';
    return 'Schedule';
  }

  changeStatus(campaign: Campaign): void {
    const status = this.effectiveStatus(campaign);
    const next: CampaignStatus =
      status === 'active' || status === 'scheduled'
        ? 'paused'
        : campaign.startDate > this.shiftDate(0)
          ? 'scheduled'
          : 'active';
    this.campaigns = this.campaigns.map((item) =>
      item.id === campaign.id ? { ...item, status: next } : item,
    );
  }

  fillWidth(campaign: Campaign): string {
    const width = Math.min(100, (campaign.filled / Math.max(1, campaign.slots)) * 100);
    return `${width}%`;
  }

  inr(amount: number): string {
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;
  }

  private shiftDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
