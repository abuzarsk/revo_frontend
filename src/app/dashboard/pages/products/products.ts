import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apiservice } from '../../../../services/apiservice';
import { ENTITY_TYPE_IDS, getTokenFromLocalStorage, STORAGE_KEYS } from '../../../../constants/app.constants';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import {
  buildPageNumbers,
  parseProductsPageResponse,
  ProductsPaginationView,
  showingFrom,
  showingTo,
} from './products-pagination.model';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {

  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;

  showForm = false;
  productForm: FormGroup;
  photoFile: File | null = null;
  photoPreview: string | null = null;
  token: any = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.token || null;
  readonly imageBaseUrl = environment.imageBaseUrl;

  editProductId: any = null;
  brandOptions: any[] = [];
  /** Brands for list filters (from getBrandsList). */
  filterBrandOptions: any[] = [];
  brandFilter: string = '';
  hasSubmissionFilter: string = '';
  hasRefundFilter: string = '';
  products: any[] = [];
  role: any = getTokenFromLocalStorage(STORAGE_KEYS.CURRENT_ROLE);
  ENTITY_TYPE_IDS: any = ENTITY_TYPE_IDS;

  /** Company products pagination */
  productsLoading = false;
  currentPage = 1;
  lastPage = 1;
  totalProducts = 0;
  perPage = 0;

  /** Mediator products pagination */
  mediatorProductsLoading = false;
  mediatorCurrentPage = 1;
  mediatorLastPage = 1;
  mediatorTotalProducts = 0;
  mediatorPerPage = 0;

  /** User products pagination */
  userProductsLoading = false;
  userCurrentPage = 1;
  userLastPage = 1;
  userTotalProducts = 0;
  userPerPage = 0;

  mediatorProducts: any[] = [];
  userProducts: any[] = [];
  viewMode: 'list' | 'table' = 'table';

  constructor(private fb: FormBuilder, private apiService: Apiservice, private cdr: ChangeDetectorRef, private router: Router) {
    this.productForm = this.fb.group({
      brand_id: [null, Validators.required],
      name: ['', Validators.required],
      order_limit: [null, [Validators.required, Validators.min(1)]],
      is_multiple_submission_by_one: [false],
      max_submission_by_one: [null, Validators.min(1)],
      default_completed_order: [null, Validators.min(0)],
      googlesheet_url: [''],
    });

    this.loadFilterBrands();

    if(this.role==ENTITY_TYPE_IDS.COMPANY){
      this.getBrands();
      this.getProducts();
    }else if(this.role==ENTITY_TYPE_IDS.MEDIATOR){
      console.log('Mediator');
      this.getMediatorProducts();
    }else if(this.role==ENTITY_TYPE_IDS.USER){
      console.log('User');
      this.getUserProducts();
    }
  }

  private productListFilters(): {
    brand_id?: string;
    has_submission?: string;
    has_refund?: string;
  } {
    const filters: {
      brand_id?: string;
      has_submission?: string;
      has_refund?: string;
    } = {};
    if (this.brandFilter !== '') {
      filters.brand_id = this.brandFilter;
    }
    if (this.hasSubmissionFilter !== '') {
      filters.has_submission = this.hasSubmissionFilter;
    }
    if (this.hasRefundFilter !== '') {
      filters.has_refund = this.hasRefundFilter;
    }
    return filters;
  }

  loadFilterBrands(): void {
    if (!this.token) {
      return;
    }
    this.apiService.getBrandsList(this.token).subscribe({
      next: (res: any) => {
        const data = res?.data?.data ?? res?.data ?? res ?? [];
        this.filterBrandOptions = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.filterBrandOptions = [];
        this.cdr.detectChanges();
      },
    });
  }

  applyProductFilters(): void {
    if (this.role === ENTITY_TYPE_IDS.COMPANY) {
      this.getProducts(1);
    } else if (this.role === ENTITY_TYPE_IDS.MEDIATOR) {
      this.getMediatorProducts(1);
    } else if (this.role === ENTITY_TYPE_IDS.USER) {
      this.getUserProducts(1);
    }
  }

  clearProductFilters(): void {
    this.brandFilter = '';
    this.hasSubmissionFilter = '';
    this.hasRefundFilter = '';
    this.applyProductFilters();
  }

  openForm(): void {
    this.editProductId = null;
    this.clearPhotoSelection();
    this.productForm.reset();
    this.showForm = true;
  }

  closeForm(): void {
    this.clearPhotoSelection();
    this.showForm = false;
    this.editProductId = null;
    this.productForm.reset();
    this.cdr.detectChanges();
  }

  private clearPhotoSelection(): void {
    this.photoFile = null;
    this.photoPreview = null;
    this.photoInput?.nativeElement && (this.photoInput.nativeElement.value = '');
  }

  saveProduct(): void {
    if (!this.productForm.valid) {
      this.productForm.markAllAsTouched();
      return;
    }
    const formData = new FormData();
    Object.entries(this.productForm.value).forEach(([key, value]) => {
      // Only append if value is not null or undefined
      if (value !== null && value !== undefined) {
        // FormData.append expects string or Blob; stringify primitives
        formData.append(key, String(value));
      }
    });
    // Attach photo if present
    if (this.photoFile) {
      formData.append('photo', this.photoFile);
     }
     //console.log(this.photoFile);
     //console.log(this.photoPreview);
    //  else if(this.editProductId!=null && this.photoPreview!=null){
    //   formData.append('photo', this.);
    
    // }
    if(this.productForm.value.is_multiple_submission_by_one){
      formData.append('is_multiple_submission_by_one', '1');
    }else{
      formData.append('is_multiple_submission_by_one', '0');
    }

    

    // console.log(this.productForm.value);
    // console.log(formData);
    // return;

    if(this.editProductId!=null){

      if(this.photoPreview!=null && this.photoFile==null){
        const photo = this.photoPreview.split('/');
        formData.append('photo', photo[photo.length-1]);
      }

      this.apiService.updateProduct(this.token, this.editProductId, formData).subscribe((res: any) => {
        console.log(res);
        this.getProducts(this.currentPage);
        this.closeForm();
        this.cdr.detectChanges();
      },(error: any) => {
        console.log(error);
        //this.closeForm();
      });
    }else{
      this.apiService.createProduct(this.token, formData).subscribe((res: any) => {
        console.log(res);
        this.getProducts(this.currentPage);
        this.closeForm();
        this.cdr.detectChanges();
      },(error: any) => {
        console.log(error);
        //this.closeForm();
      });
    }
    //console.log('Product form value:', this.productForm.value, 'photo:', this.photoFile);
    //this.closeForm();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.clearPhotoSelection();
      return;
    }
    this.photoFile = input.files[0] || null;

    if (this.photoFile) {
      const reader = new FileReader();
      reader.onload = () => {
        if (!this.showForm) {
          return;
        }
        this.photoPreview = typeof reader.result === 'string' ? reader.result : null;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.photoFile);
    }
  }

  getBrands(): void {
    this.apiService.getBrands(this.token).subscribe((res: any) => {
      this.brandOptions = res.data.data;
      this.cdr.detectChanges();
    });
  }

  getProducts(page: number = this.currentPage): void {
    if (!this.token) {
      return;
    }

    this.productsLoading = true;
    this.apiService.getProductsByCompany(this.token, page, this.productListFilters()).subscribe({
      next: (res: any) => {
        this.applyProductsPage(res, page);
        this.productsLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.log(error);
        this.products = [];
        this.productsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage || page === this.currentPage) {
      return;
    }
    this.getProducts(page);
  }

  goToMediatorPage(page: number): void {
    if (
      page < 1 ||
      page > this.mediatorLastPage ||
      page === this.mediatorCurrentPage
    ) {
      return;
    }
    this.getMediatorProducts(page);
  }

  goToUserPage(page: number): void {
    if (page < 1 || page > this.userLastPage || page === this.userCurrentPage) {
      return;
    }
    this.getUserProducts(page);
  }

  companyPaginator(position: 'top' | 'bottom'): ProductsPaginationView {
    return {
      position,
      loading: this.productsLoading,
      total: this.totalProducts,
      currentPage: this.currentPage,
      lastPage: this.lastPage,
      perPage: this.perPage,
      pageNumbers: buildPageNumbers(this.currentPage, this.lastPage),
      showingFrom: showingFrom(this.totalProducts, this.currentPage, this.perPage),
      showingTo: showingTo(
        this.totalProducts,
        this.currentPage,
        this.perPage,
        this.products.length
      ),
      itemLabel: 'products',
      goToPage: (page) => this.goToPage(page),
    };
  }

  mediatorPaginator(position: 'top' | 'bottom'): ProductsPaginationView {
    return {
      position,
      loading: this.mediatorProductsLoading,
      total: this.mediatorTotalProducts,
      currentPage: this.mediatorCurrentPage,
      lastPage: this.mediatorLastPage,
      perPage: this.mediatorPerPage,
      pageNumbers: buildPageNumbers(
        this.mediatorCurrentPage,
        this.mediatorLastPage
      ),
      showingFrom: showingFrom(
        this.mediatorTotalProducts,
        this.mediatorCurrentPage,
        this.mediatorPerPage
      ),
      showingTo: showingTo(
        this.mediatorTotalProducts,
        this.mediatorCurrentPage,
        this.mediatorPerPage,
        this.mediatorProducts.length
      ),
      itemLabel: 'products',
      goToPage: (page) => this.goToMediatorPage(page),
    };
  }

  userPaginator(position: 'top' | 'bottom'): ProductsPaginationView {
    return {
      position,
      loading: this.userProductsLoading,
      total: this.userTotalProducts,
      currentPage: this.userCurrentPage,
      lastPage: this.userLastPage,
      perPage: this.userPerPage,
      pageNumbers: buildPageNumbers(this.userCurrentPage, this.userLastPage),
      showingFrom: showingFrom(
        this.userTotalProducts,
        this.userCurrentPage,
        this.userPerPage
      ),
      showingTo: showingTo(
        this.userTotalProducts,
        this.userCurrentPage,
        this.userPerPage,
        this.userProducts.length
      ),
      itemLabel: 'products',
      goToPage: (page) => this.goToUserPage(page),
    };
  }

  private applyProductsPage(res: any, page: number): void {
    const parsed = parseProductsPageResponse(res, page);
    this.products = parsed.items;
    this.currentPage = parsed.currentPage;
    this.lastPage = parsed.lastPage;
    this.totalProducts = parsed.total;
    this.perPage = parsed.perPage;
  }

  private applyMediatorProductsPage(res: any, page: number): void {
    const parsed = parseProductsPageResponse(res, page);
    this.mediatorProducts = parsed.items;
    this.mediatorCurrentPage = parsed.currentPage;
    this.mediatorLastPage = parsed.lastPage;
    this.mediatorTotalProducts = parsed.total;
    this.mediatorPerPage = parsed.perPage;
  }

  private applyUserProductsPage(res: any, page: number): void {
    const parsed = parseProductsPageResponse(res, page);
    this.userProducts = parsed.items;
    this.userCurrentPage = parsed.currentPage;
    this.userLastPage = parsed.lastPage;
    this.userTotalProducts = parsed.total;
    this.userPerPage = parsed.perPage;
  }

  editProduct(id: any): void {
    console.log(id);
    this.editProductId = id;
    const product = this.products.find((p: any) => p.id === id);
    if (!product) return;
    this.productForm.patchValue({
      brand_id: product.brand_id,
      name: product.name,
      order_limit: product.order_limit,
      photo: product.photo,
      is_multiple_submission_by_one: product.is_multiple_submission_by_one,
      max_submission_by_one: product.max_submission_by_one,
      default_completed_order: product.default_completed_order,
      googlesheet_url: product.googlesheet_url || '',
    });
    // set preview from existing photo
    this.photoFile = null; // we don’t have a File, only a URL
    this.photoPreview = product.photo
      ? this.imageBaseUrl + 'products/' + product.photo
      : null;
    this.showForm = true;
  }

  deleteProduct(id: any): void {
    console.log(id);
  }

  promoteProduct(product: any): void {
    this.updateProductPromotionStatus(product, 1);
  }

  demoteProduct(product: any): void {
    this.updateProductPromotionStatus(product, 0);
  }


  private updateProductPromotionStatus(product: any, status: number): void {
    console.log(product);
    if(product.form_status==1){
      //this.editProduct(product.id);
      this.apiService.promotedemoteProduct(this.token, {id: product.id, status: status}).subscribe((res: any) => {
        console.log(res);
        this.getProducts(this.currentPage);
        this.cdr.detectChanges();
      },(error: any) => {
        console.log(error);
      });
    }else{
      alert('Please publish the form first');
      return;
    }
  }


  viewForm(p: any): void {
    console.log(p);
    this.router.navigate(['/builder', p.form_id]);
  }

  viewProductDetails(p: any): void {
    console.log(p);
    const id =
      this.role === ENTITY_TYPE_IDS.USER ? p.product_id : p.product_id;
    if (!id) {
      return;
    }
    if(this.role==ENTITY_TYPE_IDS.COMPANY || this.role==ENTITY_TYPE_IDS.MEDIATOR){  
      this.router.navigate(['/products', id]);
    }else{
      this.router.navigate(['/products', id, 'promoted', p.promote_id]);
    }
    // if(p.promote_id != null && p.promote_id != undefined && p.promote_id != ''){
    //   this.router.navigate(['/products', id, 'promoted', p.promote_id]);
    // }else{
    //   this.router.navigate(['/products', id, 'unpromoted', '-1']);
    // }

  }

  setViewMode(mode: 'list' | 'table'): void {
    this.viewMode = mode;
  }

  companyPromotionLabel(status: number): string {
    if (status === 1) {
      return 'Promoted';
    }
    if (status === 2) {
      return 'Demoted';
    }
    return 'Not promoted';
  }

  mediatorPromotionLabel(promoteStatus: number): string {
    return promoteStatus == 1 ? 'Promoted' : 'Not promoted';
  }

  formatMultipleSubmission(value: unknown): string {
    return this.isMultipleSubmissionEnabled(value) ? 'true' : 'false';
  }

  formatMaxSubmissionByOne(product: any): string | number {
    if (!this.isMultipleSubmissionEnabled(product?.is_multiple_submission_by_one)) {
      return '—';
    }
    return product?.max_submission_by_one ?? '—';
  }

  productSubtitle(product: any): string {
    const brand = product?.brand_name || (product?.brand_id != null ? '#' + product.brand_id : '');
    const company = product?.company_name || product?.company || '';
    if (brand && company) {
      return `${brand} · ${company}`;
    }
    return brand || company || '—';
  }

  productPrice(product: any): string {
    const value = product?.price ?? product?.product_price ?? product?.payout ?? product?.payout_value;
    if (value == null || value === '') {
      return '—';
    }
    const amount = Number(String(value).replace(/[^\d.]/g, ''));
    if (Number.isNaN(amount)) {
      return String(value);
    }
    return '₹' + amount.toLocaleString('en-IN');
  }

  productRefund(product: any): string {
    const value = product?.refund_percent ?? product?.refund_percentage;
    if (value != null && value !== '') {
      const text = String(value);
      return text.includes('%') ? text : `${text}%`;
    }
    return String(product?.refund_submission_count || 0);
  }

  private isMultipleSubmissionEnabled(value: unknown): boolean {
    return value === true || value === 1 || value === '1';
  }

  viewSubmissions(p: any): void {
    console.log(p);
    //const encodedId = btoa(String(p.id));
    this.router.navigate(['/submission', p.promote_id]);
  }


  getMediatorProducts(page: number = this.mediatorCurrentPage): void {
    if (!this.token) {
      return;
    }

    this.mediatorProductsLoading = true;
    this.apiService.getMediatorProducts(this.token, page, this.productListFilters()).subscribe({
      next: (res: any) => {
        this.applyMediatorProductsPage(res, page);
        this.mediatorProductsLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.log(error);
        this.mediatorProducts = [];
        this.mediatorProductsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
  
  promotedemoteMediatorProduct(product: any,status:number): void {
    console.log(product);
    this.apiService.promotedemoteMediatorProduct(this.token, {product_id: product.id,  status: status}).subscribe((res: any) => {
      console.log(res);
      this.getMediatorProducts(this.mediatorCurrentPage);
      this.cdr.detectChanges();
    },(error: any) => {
      console.log(error);
    });
  }

  
  getUserProducts(page: number = this.userCurrentPage): void {
    if (!this.token) {
      return;
    }

    this.userProductsLoading = true;
    this.apiService.getUserProducts(this.token, page, this.productListFilters()).subscribe({
      next: (res: any) => {
        this.applyUserProductsPage(res, page);
        this.userProductsLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.log(error);
        this.userProducts = [];
        this.userProductsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
  
  form(p: any): void {
    console.log(p);
    this.router.navigate(['/form', p.promote_id]);
  }

  refundForm(p: any): void {
    console.log(p);
    this.router.navigate(['/builder', p.refund_form_id]);
  }

  viewRefundSubmissions(p: any): void {
    console.log(p);
    this.router.navigate(['/refund/submission', p.promote_id]);
  }
  
}
