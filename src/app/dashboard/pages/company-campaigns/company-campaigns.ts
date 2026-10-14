import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  ENTITY_TYPE_IDS,
  getTokenFromLocalStorage,
  STORAGE_KEYS,
} from '../../../../constants/app.constants';
import { Apiservice } from '../../../../services/apiservice';

type CampaignStatus = 'draft' | 'active' | 'paused';

interface Campaign {
  id: string;
  productId: string | number | null;
  name: string;
  channel: string;
  budget: number;
  filled: number;
  limit: number;
  status: CampaignStatus;
  formStatus: number;
  localOnly: boolean;
}

@Component({
  selector: 'app-company-campaigns',
  imports: [CommonModule],
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
    return campaign.status;
  }

  actionLabel(campaign: Campaign): string {
    const status = this.effectiveStatus(campaign);
    if (status === 'active') {
      return 'Pause';
    }
    if (status === 'paused') {
      return 'Resume';
    }
    return 'Activate';
  }

  badgeClass(campaign: Campaign): string {
    const status = this.effectiveStatus(campaign);
    if (status === 'active') {
      return 'cc-badge--active';
    }
    if (status === 'paused') {
      return 'cc-badge--paused';
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

  changeStatus(campaign: Campaign): void {
    const status = this.effectiveStatus(campaign);
    if (status === 'active') {
      this.setStatus(campaign, 'paused', 0);
      return;
    }
    this.setStatus(campaign, 'active', 1);
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
}
