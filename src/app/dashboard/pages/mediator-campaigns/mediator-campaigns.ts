import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ENTITY_TYPE_IDS } from '../../../../constants';
import { readRoleId } from '../member/member-role';

type CampaignStatus = 'active' | 'paused' | 'draft' | 'scheduled' | 'completed';

interface Campaign {
  id: string;
  name: string;
  company: string;
  products: number;
  slots: number;
  filled: number;
  commission: number;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
}

interface CampaignView extends Campaign {
  effectiveStatus: CampaignStatus;
}

const FILTERS: Array<'all' | CampaignStatus> = ['all', 'active', 'scheduled', 'paused', 'draft', 'completed'];

function campaignDate(offsetDays: number, from = new Date()): string {
  const date = new Date(from);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && campaignDate(0, parsed) === value;
}

function validateCampaignDates(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) {
    return 'Choose both a start date and an end date.';
  }
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return 'Enter valid campaign dates.';
  }
  if (startDate >= endDate) {
    return 'The end date must be after the start date.';
  }
  if (endDate < campaignDate(0)) {
    return 'The campaign end date has already passed.';
  }
  return null;
}

function effectiveCampaignStatus(status: CampaignStatus, startDate: string, endDate: string): CampaignStatus {
  if (status === 'draft') {
    return status;
  }
  const today = campaignDate(0);
  if (endDate && endDate < today) {
    return 'completed';
  }
  if (status === 'active' || status === 'scheduled') {
    return startDate && startDate > today ? 'scheduled' : 'active';
  }
  return status;
}

function seedCampaigns(): Campaign[] {
  return [
    {
      id: 'CMP-311',
      name: 'Smart Watch launch push',
      company: 'Company Alpha',
      products: 3,
      slots: 120,
      filled: 96,
      commission: 6420,
      status: 'active',
      startDate: campaignDate(-10),
      endDate: campaignDate(8),
    },
    {
      id: 'CMP-308',
      name: 'Festive audio bundle',
      company: 'Company Alpha',
      products: 5,
      slots: 200,
      filled: 184,
      commission: 9120,
      status: 'active',
      startDate: campaignDate(-10),
      endDate: campaignDate(16),
    },
    {
      id: 'CMP-302',
      name: 'Power accessories week',
      company: 'Nova Retail',
      products: 4,
      slots: 150,
      filled: 88,
      commission: 4880,
      status: 'active',
      startDate: campaignDate(-10),
      endDate: campaignDate(4),
    },
    {
      id: 'CMP-297',
      name: 'New member onboarding',
      company: 'Urban Labs',
      products: 2,
      slots: 80,
      filled: 12,
      commission: 940,
      status: 'paused',
      startDate: campaignDate(-5),
      endDate: campaignDate(26),
    },
    {
      id: 'CMP-290',
      name: 'Speaker review drive',
      company: 'Glow Partners',
      products: 2,
      slots: 100,
      filled: 100,
      commission: 5300,
      status: 'completed',
      startDate: campaignDate(-20),
      endDate: campaignDate(-6),
    },
    {
      id: 'CMP-315',
      name: 'Winter wearables teaser',
      company: 'Company Alpha',
      products: 2,
      slots: 90,
      filled: 0,
      commission: 0,
      status: 'draft',
      startDate: campaignDate(7),
      endDate: campaignDate(37),
    },
  ];
}

@Component({
  selector: 'app-mediator-campaigns',
  imports: [CommonModule, FormsModule],
  templateUrl: './mediator-campaigns.html',
  styleUrl: './mediator-campaigns.css',
})
export class MediatorCampaigns implements OnInit {
  readonly filters = FILTERS;
  campaigns: Campaign[] = seedCampaigns();
  query = '';
  status: 'all' | CampaignStatus = 'all';
  notice = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (readRoleId() !== ENTITY_TYPE_IDS.MEDIATOR) {
      this.router.navigateByUrl('/');
    }
  }

  get listed(): CampaignView[] {
    return this.campaigns.map((campaign) => ({
      ...campaign,
      effectiveStatus: effectiveCampaignStatus(campaign.status, campaign.startDate, campaign.endDate),
    }));
  }

  get filtered(): CampaignView[] {
    const query = this.query.trim().toLowerCase();
    return this.listed.filter((campaign) => {
      const matchesStatus = this.status === 'all' || campaign.effectiveStatus === this.status;
      const blob = `${campaign.id} ${campaign.name} ${campaign.company}`.toLowerCase();
      return matchesStatus && blob.includes(query);
    });
  }

  get active(): CampaignView[] {
    return this.listed.filter((campaign) => campaign.effectiveStatus === 'active');
  }

  get activeCount(): number {
    return this.active.length;
  }

  get fillRate(): number {
    const filled = this.active.reduce((sum, campaign) => sum + campaign.filled, 0);
    const slots = this.active.reduce((sum, campaign) => sum + campaign.slots, 0);
    return Math.round((filled / Math.max(1, slots)) * 100);
  }

  get openCommission(): string {
    const total = this.active.reduce((sum, campaign) => sum + campaign.commission, 0);
    return this.inr(total);
  }

  get companyCount(): number {
    return new Set(this.campaigns.map((campaign) => campaign.company)).size;
  }

  fillWidth(campaign: Campaign): number {
    return campaign.slots ? (campaign.filled / campaign.slots) * 100 : 0;
  }

  money(value: number): string {
    return this.inr(value);
  }

  actionLabel(status: CampaignStatus): string {
    if (status === 'active' || status === 'scheduled') {
      return 'Pause';
    }
    if (status === 'paused') {
      return 'Resume';
    }
    if (status === 'completed') {
      return 'Schedule again';
    }
    return 'Schedule';
  }

  setStatus(status: 'all' | CampaignStatus): void {
    this.status = status;
  }

  clearFilters(): void {
    this.query = '';
    this.status = 'all';
  }

  updateDate(id: string, field: 'startDate' | 'endDate', value: string): void {
    this.campaigns = this.campaigns.map((campaign) =>
      campaign.id === id ? { ...campaign, [field]: value } : campaign,
    );
  }

  toggle(campaign: CampaignView): void {
    if (campaign.effectiveStatus === 'active' || campaign.effectiveStatus === 'scheduled') {
      this.campaigns = this.campaigns.map((item) =>
        item.id === campaign.id ? { ...item, status: 'paused' } : item,
      );
      this.notice = `${campaign.name} paused`;
      return;
    }
    const issue = validateCampaignDates(campaign.startDate, campaign.endDate);
    if (issue) {
      this.notice = issue;
      return;
    }
    const next: CampaignStatus = campaign.startDate > campaignDate(0) ? 'scheduled' : 'active';
    this.campaigns = this.campaigns.map((item) =>
      item.id === campaign.id ? { ...item, status: next } : item,
    );
    this.notice = next === 'scheduled' ? `${campaign.name} scheduled` : `${campaign.name} activated`;
  }

  create(): void {
    const id = `CMP-${316 + this.campaigns.length - 6}`;
    this.campaigns = [
      {
        id,
        name: 'Untitled campaign',
        company: 'Company Alpha',
        products: 1,
        slots: 50,
        filled: 0,
        commission: 0,
        status: 'draft',
        startDate: campaignDate(1),
        endDate: campaignDate(31),
      },
      ...this.campaigns,
    ];
    this.notice = "Draft campaign created. Fill in the details when you're ready.";
  }

  private inr(value: number): string {
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
  }
}
