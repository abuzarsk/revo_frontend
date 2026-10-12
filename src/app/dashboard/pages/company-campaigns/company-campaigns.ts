import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  ENTITY_TYPE_IDS,
  getTokenFromLocalStorage,
  STORAGE_KEYS,
} from '../../../../constants/app.constants';
import { Apiservice } from '../../../../services/apiservice';

interface Campaign {
  id: string | number;
  name: string;
  brand: string;
  filled: number;
  limit: number;
  status: number;
}

@Component({
  selector: 'app-company-campaigns',
  imports: [CommonModule],
  templateUrl: './company-campaigns.html',
  styleUrls: ['../company-portal/company-portal.css'],
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
    return this.campaigns.filter((item) => item.status === 1).length;
  }

  get filledSlots(): string {
    const filled = this.campaigns.reduce((sum, item) => sum + item.filled, 0);
    const limit = this.campaigns.reduce((sum, item) => sum + item.limit, 0);
    return `${filled} / ${limit}`;
  }

  get remainingOrders(): number {
    return this.campaigns.reduce(
      (sum, item) => sum + Math.max(item.limit - item.filled, 0),
      0,
    );
  }

  statusLabel(campaign: Campaign): string {
    if (campaign.status === 1) {
      return 'Promoted';
    }
    if (campaign.status === 2) {
      return 'Demoted';
    }
    return 'Not promoted';
  }

  statusClass(campaign: Campaign): string {
    if (campaign.status === 1) {
      return 'cp-badge--active';
    }
    if (campaign.status === 2) {
      return 'cp-badge--paused';
    }
    return 'cp-badge--muted';
  }

  openProduct(campaign: Campaign): void {
    if (!campaign.id) {
      return;
    }
    this.router.navigate(['/products', campaign.id]);
  }

  fillWidth(campaign: Campaign): string {
    if (!campaign.limit) {
      return '0%';
    }
    const width = Math.min(100, (campaign.filled / campaign.limit) * 100);
    return `${width}%`;
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
        this.campaigns = all;
        this.loading = false;
        this.loadError = '';
        this.cdr.detectChanges();
      },
      error: (error: { error?: { message?: string }; message?: string }) => {
        this.campaigns = [];
        this.loading = false;
        this.loadError = error?.error?.message || error?.message || 'Failed to load campaigns.';
        this.cdr.detectChanges();
      },
    });
  }

  private toCampaign(product: any): Campaign {
    return {
      id: product.id,
      name: product.name || 'Product',
      brand: product.brand_name || '',
      filled: Number(product.submission_count || 0),
      limit: Number(product.order_limit || 0),
      status: Number(product.status || 0),
    };
  }
}
