import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apiservice } from '../../../../services/apiservice';
import { getTokenFromLocalStorage, STORAGE_KEYS } from '../../../../constants/app.constants';
import {
  buildPageNumbers,
  getPaginationRedirectPage,
  PaginatedListView,
  PaginatedPageMeta,
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
export class Brands {

  showForm = false;
  token: any = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.token || null;
  brandForm: FormGroup;

  editBrandId: any = null;
  brands: any[] = [];
  brandsLoading = false;

  currentPage = 1;
  lastPage = 1;
  totalBrands = 0;
  perPage = 0;
  viewMode: 'cards' | 'list' = 'cards';

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

  setViewMode(mode: 'cards' | 'list'): void {
    this.viewMode = mode;
    this.cdr.detectChanges();
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

  getBrands(page: number = this.currentPage): void {
    if (!this.token) {
      return;
    }

    this.brandsLoading = true;
    this.apiService
      .getBrands(this.token, page, this.perPage || undefined)
      .subscribe({
        next: (res: any) => {
          const parsed = parsePaginatedResponse(res, page);
          const redirect = getPaginationRedirectPage(parsed, page);
          if (redirect !== null) {
            this.getBrands(redirect);
            return;
          }
          this.applyBrandsPage(parsed);
          this.brandsLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.log(error);
          this.brands = [];
          this.brandsLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage || page === this.currentPage) {
      return;
    }
    this.getBrands(page);
  }

  private applyBrandsPage(parsed: PaginatedPageMeta): void {
    this.brands = parsed.items;
    this.currentPage = parsed.currentPage;
    this.lastPage = parsed.lastPage;
    this.totalBrands = parsed.total;
    this.perPage = parsed.perPage;
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
