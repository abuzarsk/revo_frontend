import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apiservice } from '../../../../services/apiservice';
import { getTokenFromLocalStorage, STORAGE_KEYS } from '../../../../constants/app.constants';
import {
  buildPageNumbers,
  getPaginationRedirectPage,
  PaginatedListView,
  parsePaginatedResponse,
  showingFrom,
  showingTo,
} from '../products/products-pagination.model';

@Component({
  selector: 'app-brands',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './brands.html',
  styleUrl: './brands.css',
})
export class Brands implements AfterViewInit, OnDestroy {

  showForm = false;
  token: any = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.token || null;
  brandForm: FormGroup;

  editBrandId: any = null;
  brands: any[] = [];
  allBrands: any[] = [];
  brandsLoading = false;

  currentPage = 1;
  lastPage = 1;
  totalBrands = 0;
  perPage = 0;
  pageSize = 0;
  viewMode: 'cards' | 'list' = 'cards';
  @ViewChild('brandStage') brandStage?: ElementRef<HTMLElement>;
  private stageObserver?: ResizeObserver;
  private fitting = false;

  constructor(private fb: FormBuilder, private apiService: Apiservice, private cdr: ChangeDetectorRef) {
    this.brandForm = this.fb.group({
      name: ['', Validators.required],
    });
    this.getBrands();
  }

  get brandPaginator(): PaginatedListView {
    return {
      loading: this.brandsLoading,
      total: this.totalBrands,
      currentPage: this.currentPage,
      lastPage: this.lastPage,
      perPage: this.perPage,
      pageNumbers: buildPageNumbers(this.currentPage, this.lastPage),
      showingFrom: showingFrom(this.totalBrands, this.currentPage, this.perPage),
      showingTo: showingTo(
        this.totalBrands,
        this.currentPage,
        this.perPage,
        this.brands.length
      ),
      itemLabel: 'brands',
      goToPage: (page) => this.goToPage(page),
    };
  }

  addBrand(): void {
    this.brandForm.reset();
    this.showForm = true;
    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    const stage = this.brandStage?.nativeElement;
    if (!stage || typeof ResizeObserver === 'undefined') {
      return;
    }
    this.stageObserver = new ResizeObserver(() => this.syncPageSize());
    this.stageObserver.observe(stage);
  }

  ngOnDestroy(): void {
    this.stageObserver?.disconnect();
  }

  get activeBrands(): number {
    const inactive = this.allBrands.filter((brand) => brand?.active === false || brand?.status === 0 || brand?.status === 'inactive').length;
    if (!this.allBrands.length) {
      return 0;
    }
    return inactive ? Math.max(0, this.totalBrands - inactive) : this.totalBrands;
  }

  get pageLabel(): string {
    if (!this.totalBrands) {
      return '0 / 0';
    }
    return `${this.currentPage} / ${this.lastPage || 1}`;
  }

  initials(name: string): string {
    return String(name || '?').trim().slice(0, 2).toUpperCase();
  }

  brandMeta(brand: any): string {
    const count = brand?.products_count ?? brand?.product_count ?? brand?.active_products;
    if (count != null && count !== '') {
      const value = Number(count) || 0;
      return `${value} active product${value === 1 ? '' : 's'}`;
    }
    return brand?.created_on ? `Created ${brand.created_on}` : 'Brand identity';
  }

  setViewMode(mode: 'cards' | 'list'): void {
    this.viewMode = mode;
    this.currentPage = 1;
    this.pageSize = this.estimatePageSize();
    this.publishPage();
    this.cdr.detectChanges();
    requestAnimationFrame(() => this.syncPageSize());
  }

  saveBrand(): void {
    if (!this.brandForm.valid || !this.token) {
      this.brandForm.markAllAsTouched();
      return;
    }

    if (this.editBrandId) {
      this.apiService.brandUpdate(this.token, this.editBrandId, {
        brand_name: this.brandForm.value.name,
      }).subscribe({
        next: () => {
          this.getBrands(this.currentPage);
          this.closeForm();
        },
        error: (error) => console.log(error),
      });
    } else {
      this.apiService.brandCreate(this.token, {
        brand_name: this.brandForm.value.name,
      }).subscribe({
        next: () => {
          this.getBrands(this.currentPage);
          this.closeForm();
        },
        error: (error) => console.log(error),
      });
    }
  }

  getBrands(page: number = 1): void {
    if (!this.token) {
      return;
    }

    this.brandsLoading = true;
    this.currentPage = page;
    this.loadAllBrands();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.publishPage();
    this.cdr.detectChanges();
  }

  private loadAllBrands(page = 1, collected: any[] = []): void {
    this.apiService.getBrands(this.token, page, 200).subscribe({
      next: (res: any) => {
        const parsed = parsePaginatedResponse(res, page);
        const redirect = getPaginationRedirectPage(parsed, page);
        if (redirect !== null && redirect !== page) {
          this.loadAllBrands(redirect, []);
          return;
        }
        collected.push(...parsed.items);
        const total = parsed.total || collected.length;
        if (page < parsed.lastPage && collected.length < total && page < 25) {
          this.loadAllBrands(page + 1, collected);
          return;
        }
        this.allBrands = collected;
        this.totalBrands = total;
        this.pageSize = this.estimatePageSize();
        if (this.currentPage > Math.ceil(total / Math.max(this.pageSize, 1))) {
          this.currentPage = 1;
        }
        this.publishPage();
        this.brandsLoading = false;
        this.cdr.detectChanges();
        requestAnimationFrame(() => this.syncPageSize());
      },
      error: (error) => {
        console.log(error);
        this.allBrands = [];
        this.brands = [];
        this.totalBrands = 0;
        this.brandsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private columnCount(): number {
    if (this.viewMode === 'list' || window.innerWidth < 640) {
      return 1;
    }
    return window.innerWidth >= 1280 ? 4 : 2;
  }

  private estimatePageSize(): number {
    const across = this.columnCount();
    const card = this.viewMode === 'cards' ? 214 : 82;
    const gap = this.viewMode === 'cards' ? 16 : 8;
    const available = Math.max(card, window.innerHeight - 420);
    const rows = Math.max(1, Math.floor((available + gap) / (card + gap)));
    return Math.max(across, rows * across);
  }

  private syncPageSize(): void {
    if (this.fitting || this.brandsLoading || !this.allBrands.length) {
      return;
    }
    const stage = this.brandStage?.nativeElement;
    const content = stage?.closest('.dashboard-content') as HTMLElement | null;
    if (!stage || !content) {
      return;
    }
    const across = this.columnCount();
    const gap = this.viewMode === 'cards' ? 16 : 8;
    const sample = stage.querySelector('.bd-card, .bd-row') as HTMLElement | null;
    const cardHeight = sample?.getBoundingClientRect().height || (this.viewMode === 'cards' ? 214 : 82);
    const stageOffset =
      stage.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop;
    const fit = (reserve: number) => {
      const available = content.clientHeight - stageOffset - reserve;
      const rows = Math.max(1, Math.floor((available + gap) / (cardHeight + gap)));
      return Math.max(across, rows * across);
    };
    let size = Math.min(fit(8), this.allBrands.length);
    if (size < this.allBrands.length) {
      size = Math.min(fit(120), this.allBrands.length);
    }
    if (!size || size === this.pageSize) {
      return;
    }
    this.pageSize = size;
    const last = Math.max(1, Math.ceil(this.allBrands.length / size));
    if (this.currentPage > last) {
      this.currentPage = last;
    }
    this.fitting = true;
    this.publishPage();
    this.cdr.detectChanges();
    this.fitting = false;
  }

  private publishPage(): void {
    const size = Math.max(1, this.pageSize || this.allBrands.length || 1);
    this.perPage = size;
    this.lastPage = Math.max(1, Math.ceil(this.allBrands.length / size));
    const start = (this.currentPage - 1) * size;
    this.brands = this.allBrands.slice(start, start + size);
  }

  editBrand(id: any): void {
    this.brandForm.reset();
    this.showForm = true;
    this.editBrandId = id;
    this.brandForm.patchValue({
      name: this.brands.find((brand: any) => brand.id === id)?.brand_name || '',
    });
  }

  deleteBrand(id: any): void {
    console.log(id);
  }

  closeForm(): void {
    this.showForm = false;
    this.editBrandId = null;
    this.brandForm.reset();
    this.cdr.detectChanges();
  }
}
