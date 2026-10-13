import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ENTITY_TYPE_IDS,
  getTokenFromLocalStorage,
  STORAGE_KEYS,
} from '../../../../constants/app.constants';
import { Apiservice } from '../../../../services/apiservice';

type CampaignStatus = 'draft' | 'active' | 'paused' | 'scheduled' | 'completed';

interface Campaign {
  id: string;
  productId: string | number | null;
  name: string;
  channel: string;
  budget: number;
  filled: number;
  limit: number;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  formStatus: number;
  localOnly: boolean;
}

@Component({
  selector: 'app-company-campaigns',
  imports: [CommonModule, FormsModule],
  templateUrl: './company-campaigns.html',
  styleUrls: ['../company-portal/company-portal.css', './company-campaigns.css'],
})
export class CompanyCampaigns implements OnInit {
  campaigns: Campaign[] = [];
  loading = true;
  loadError = '';

  private token = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.token || '';

  constructor(
    private api: Apiservice,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const role = Number(getTokenFromLocalStorage(STORAGE_KEYS.CURRENT_ROLE));
    if (role !== ENTITY_TYPE_IDS.COMPANY) {
      this.router.navigate(['/']);
      return;
    }
    this.loadPage(1, []);
  }

  get activeCount(): number {
    return this.campaigns.filter((item) => this.effectiveStatus(item) === 'active').length;
  }

  get filledSlots(): string {
    const filled = this.campaigns.reduce((sum, item) => sum + item.filled, 0);
    const limit = this.campaigns.reduce((sum, item) => sum + item.limit, 0);
    return `${filled} / ${limit}`;
  }

  get plannedBudget(): string {
    const total = this.campaigns.reduce((sum, item) => sum + item.budget, 0);
    return this.inr(total);
  }

  effectiveStatus(campaign: Campaign): CampaignStatus {
    if (campaign.status === 'draft') {
      return 'draft';
    }
    const today = this.dateOffset(0);
    if (campaign.endDate && campaign.endDate < today) {
      return 'completed';
    }
    if (campaign.status === 'active' || campaign.status === 'scheduled') {
      return campaign.startDate && campaign.startDate > today ? 'scheduled' : 'active';
    }
    return campaign.status;
  }

  actionLabel(campaign: Campaign): string {
    const status = this.effectiveStatus(campaign);
    if (status === 'active' || status === 'scheduled') {
      return 'Pause';
    }
    if (status === 'completed') {
      return 'Schedule again';
    }
    if (status === 'paused') {
      return 'Resume';
    }
    return 'Schedule';
  }

  badgeClass(campaign: Campaign): string {
    const status = this.effectiveStatus(campaign);
    if (status === 'active') {
      return 'cc-badge--active';
    }
    if (status === 'paused') {
      return 'cc-badge--paused';
    }
    if (status === 'completed') {
      return 'cc-badge--completed';
    }
    return 'cc-badge--muted';
  }

  subtitle(campaign: Campaign): string {
    return `${campaign.channel} · Budget ${this.inr(campaign.budget)}`;
  }

  fillWidth(campaign: Campaign): string {
    const width = Math.min(100, (campaign.filled / Math.max(1, campaign.limit)) * 100);
    return `${width}%`;
  }

  inr(amount: number): string {
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;
  }

  createCampaign(): void {
    const count = this.campaigns.length + 1;
    this.campaigns = [
      {
        id: `draft-${Date.now()}`,
        productId: null,
        name: `Untitled campaign ${count}`,
        channel: 'Member portal',
        budget: 25000,
        filled: 0,
        limit: 50,
        status: 'draft',
        startDate: this.dateOffset(1),
        endDate: this.dateOffset(31),
        formStatus: 0,
        localOnly: true,
      },
      ...this.campaigns,
    ];
  }

  updateDate(campaign: Campaign, field: 'startDate' | 'endDate', value: string): void {
    this.campaigns = this.campaigns.map((item) =>
      item.id === campaign.id ? { ...item, [field]: value } : item,
    );
  }

  changeStatus(campaign: Campaign): void {
    const status = this.effectiveStatus(campaign);
    if (status === 'active' || status === 'scheduled') {
      this.setStatus(campaign, 'paused', 0);
      return;
    }
    const issue = this.validateDates(campaign.startDate, campaign.endDate);
    if (issue) {
      window.alert(issue);
      return;
    }
    const next = campaign.startDate > this.dateOffset(0) ? 'scheduled' : 'active';
    this.setStatus(campaign, next, 1);
  }

  private setStatus(campaign: Campaign, next: CampaignStatus, apiStatus: number): void {
    if (campaign.localOnly || campaign.productId == null) {
      this.campaigns = this.campaigns.map((item) =>
        item.id === campaign.id ? { ...item, status: next } : item,
      );
      return;
    }
    if (campaign.formStatus !== 1) {
      window.alert('Please publish the form first');
      return;
    }
    this.api.promotedemoteProduct(this.token, { id: campaign.productId, status: apiStatus }).subscribe({
      next: () => {
        this.campaigns = this.campaigns.map((item) =>
          item.id === campaign.id ? { ...item, status: next } : item,
        );
        this.cdr.detectChanges();
      },
      error: () => {
        window.alert('Could not update this campaign.');
      },
    });
  }

  private validateDates(startDate: string, endDate: string): string | null {
    if (!startDate || !endDate) {
      return 'Choose both a start date and an end date.';
    }
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      return 'Enter valid campaign dates.';
    }
    if (startDate >= endDate) {
      return 'The end date must be after the start date.';
    }
    if (endDate < this.dateOffset(0)) {
      return 'The campaign end date has already passed.';
    }
    return null;
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const parsed = new Date(`${value}T00:00:00`);
    return !Number.isNaN(parsed.getTime()) && this.dateOffset(0, parsed) === value;
  }

  private loadPage(page: number, collected: Campaign[]): void {
    if (!this.token) {
      this.loading = false;
      this.loadError = 'Please log in to view campaigns.';
      this.cdr.detectChanges();
      return;
    }

    this.api.getProductsByCompany(this.token, page, undefined, 100).subscribe({
      next: (res: any) => {
        const payload = res?.data ?? {};
        const items = Array.isArray(payload.data) ? payload.data : [];
        const pageItems = items.map((product: any) => this.toCampaign(product));
        const all = collected.concat(pageItems);
        const lastPage = Math.max(1, Number(payload.pagination?.total_pages ?? 1));
        if (page < lastPage) {
          this.loadPage(page + 1, all);
          return;
        }
        const drafts = this.campaigns.filter((item) => item.localOnly);
        this.campaigns = [...drafts, ...all];
        this.loading = false;
        this.loadError = '';
        this.cdr.detectChanges();
      },
      error: (error: { error?: { message?: string }; message?: string }) => {
        this.campaigns = this.campaigns.filter((item) => item.localOnly);
        this.loading = false;
        this.loadError = error?.error?.message || error?.message || 'Failed to load campaigns.';
        this.cdr.detectChanges();
      },
    });
  }

  private toCampaign(product: any): Campaign {
    const status = this.productStatus(Number(product.status || 0));
    return {
      id: String(product.id),
      productId: product.id,
      name: product.name || 'Product',
      channel: product.brand_name || 'Member portal',
      budget: Number(product.budget || product.price || 0),
      filled: Number(product.submission_count || 0),
      limit: Number(product.order_limit || 0),
      status,
      startDate: this.dateOffset(status === 'draft' ? 7 : -5),
      endDate: this.dateOffset(status === 'draft' ? 37 : 25),
      formStatus: Number(product.form_status || 0),
      localOnly: false,
    };
  }

  private productStatus(status: number): CampaignStatus {
    if (status === 1) {
      return 'active';
    }
    if (status === 2) {
      return 'paused';
    }
    return 'draft';
  }

  private dateOffset(offsetDays: number, from = new Date()): string {
    const date = new Date(from);
    date.setDate(date.getDate() + offsetDays);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
