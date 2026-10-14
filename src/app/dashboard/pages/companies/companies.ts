import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Apiservice } from '../../../../services/apiservice';
import { getTokenFromLocalStorage, STORAGE_KEYS, STATUS_LABELS, ENTITY_TYPE_IDS } from '../../../../constants';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-companies',
  imports: [CommonModule, FormsModule],
  templateUrl: './companies.html',
  styleUrl: './companies.css',
})
export class Companies {

  readonly imageBaseUrl = environment.imageBaseUrl;

  token: any;
  role: any;
  activeTab: 'companies' | 'requests' | 'rejected' = 'companies';
  
  companiesList: any[] = [];
  companyRequestsList: any[] = [];
  loadingCompanies = false;
  loadingRequests = false;
  tokenObj: any;
  showConnectOverlay = false;
  connectSearch = '';
  connectResults: any[] = [];

  mediatorConnectedCompanies: any[] = [];
  mediatorRequestedCompanies: any[] = [];
  mediatorRejectedCompanies: any[] = [];
  mediatorListsReady = false;
  private mediatorLoadsPending = 0;
  requestFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'pending';
  requestQuery = '';
  ENTITY_TYPE_IDS: any = ENTITY_TYPE_IDS;

  constructor(private apiService: Apiservice, private cdr: ChangeDetectorRef, private router: Router) {
    this.tokenObj = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ);
    const storedRole = getTokenFromLocalStorage(STORAGE_KEYS.CURRENT_ROLE);
    this.role = Number(storedRole ?? this.tokenObj?.user?.default_role ?? null) || null;
    this.token = this.tokenObj?.token ?? null;
  }

  ngOnInit(): void {
    //console.log(this.token);

    this.getCompaniesData();
  }

  getCompaniesData(): void {
    if(this.role == ENTITY_TYPE_IDS.ADMIN){
      this.getCompanies(this.token);
      this.getCompanyRequests(this.token);
      this.setTab('companies');
    }else if(this.role == ENTITY_TYPE_IDS.MEDIATOR){
      this.setTab(this.router.url.includes('company-requests') ? 'requests' : 'companies');
      this.mediatorListsReady = false;
      this.mediatorLoadsPending = 3;
      this.getMediatorConnectedCompanies();
      this.getMediatorRequestedCompanies();
      this.getMediatorRejectedCompanies();
    }

  }

  setTab(tab: 'companies' | 'requests' | 'rejected'): void {
    console.log(tab);
    this.activeTab = tab;
  }

  openConnectOverlay(): void {
    this.showConnectOverlay = true;
    this.connectSearch = '';
    this.connectResults = [];
  }

  closeConnectOverlay(): void {
    this.showConnectOverlay = false;
  }

  searchCompanies(): void {
    const term = this.connectSearch.trim().toLowerCase();
    this.getCompanySearch(term);
  }

  /** Status label from STATUS_LABELS (e.g. 1 → Verified, 3 → Paused) */
  getStatusLabel(status: number | null | undefined): string {
    if (status == null) return '—';
    return STATUS_LABELS[status] ?? String(status);
  }

  /** Logo URL: use as-is if absolute, else prepend imageBaseUrl */
  getLogoUrl(logo: string | null | undefined): string | null {
    if (!logo) return null;
    if (logo.startsWith('http://') || logo.startsWith('https://')) return logo;
    const base = this.imageBaseUrl.endsWith('/') ? this.imageBaseUrl : this.imageBaseUrl + '/';
    return base +'companies/'+ (logo.startsWith('/') ? logo.slice(1) : logo);
  }

  getCompanies(token: any): void {
    
    this.loadingCompanies = true;
    this.apiService.getAllCompanies(token).subscribe(
      (res: any) => {
        //console.log(res);
        this.companiesList = Array.isArray(res?.data?.data) ? res.data.data : [];
        this.loadingCompanies = false;
        console.log(this.companiesList);
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.log(error);
        this.loadingCompanies = false;
      }
    );
    // this.apiService.getAllCompanies(token).subscribe({
    //    (res: any) => {
    //     console.log(res);
    //     this.companiesList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    //     this.loadingCompanies = false;
    //     console.log(this.companiesList);
    //   },
    //   error: () => {
    //     this.loadingCompanies = false;
    //   },
    // });
  }

  getCompanyRequests(token: any): void {
    if (!token) return;
    this.loadingRequests = true;
    this.apiService.getCompanyRequests(token).subscribe(
       (res: any) => {
        //console.log(res);
        this.companyRequestsList = Array.isArray(res?.data?.data) ? res.data.data : [];
        this.loadingRequests = false;
        this.cdr.detectChanges();
      },
      (error:any) => {
        console.log(error);
        this.loadingRequests = false;
      }
    );
  }


  pauseCompanyRequest(row:any): void {
    console.log(row);
    this.apiService.pauseCompany(this.token,{company:row.company}).subscribe(
      (res: any) => {
        console.log(res);
        this.getCompanies(this.token);
        this.getCompanyRequests(this.token);
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.log(error);
      }
    );
  }
  approveCompanyRequest(data:any): void {
    console.log(data);

    this.apiService.verifyCompany(this.token,{company:data.company.company,status:1}).subscribe(
      (res: any) => {
        console.log(res);
        this.getCompanies(this.token);
        this.getCompanyRequests(this.token);
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.log(error);
      }
    );
  }

  rejectCompanyRequest(data:any): void {
    console.log(data);


  }

  cancelCompanyRequest(data:any): void {
    console.log(data);

    this.apiService.cancelCompany(this.token,{company:data.company}).subscribe(
      (res: any) => {
        console.log(res);
        this.getCompanies(this.token);
        this.getCompanyRequests(this.token);
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.log(error);
      }
    );
  }

  resumeCompanyRequest(data:any): void {
    console.log(data);

    this.apiService.resumeCompany(this.token,{company:data.company}).subscribe(
      (res: any) => {
        console.log(res);
        this.getCompanies(this.token);
        this.getCompanyRequests(this.token);
        this.cdr.detectChanges(); 
      },
      (error: any) => {
        console.log(error);
      }
    );
  }


  getCompanySearch(alias:any): void {   
    this.apiService.getCompanySearch(this.token,alias).subscribe(
      (res: any) => {
        this.connectResults = res.data;//Array.isArray(res?.data?.data) ? res.data.data : [];
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.log(error);
      }
    );
  }

  revoConnect(data: any): void {
    const connects = this.ensureConnectsObject(data);
    if (connects.process || connects.status === 0 || connects.status === 1) {
      return;
    }

    connects.process = true;
    this.cdr.detectChanges();

    this.apiService.revoConnect(this.token, { company: data.company }).subscribe({
      next: () => {
        connects.process = false;
        connects.status = 0;
        this.getMediatorRequestedCompanies();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.log(error);
        connects.process = false;
        this.cdr.detectChanges();
      },
    });
  }

  getConnects(company: any): any | null {
    const connects = company?.connects;
    if (!connects) {
      return null;
    }
    if (Array.isArray(connects)) {
      return connects.length > 0 ? connects[0] : null;
    }
    return connects;
  }

  private ensureConnectsObject(company: any): any {
    const existing = this.getConnects(company);
    if (existing && !Array.isArray(company.connects)) {
      return existing;
    }

    const connects = existing ?? {};
    company.connects = connects;
    return connects;
  }

  canShowConnectButton(company: any): boolean {
    const connects = this.getConnects(company);
    if (!connects) {
      return true;
    }
    if (connects.process) {
      return true;
    }
    if (connects.status === 0 || connects.status === 1) {
      return false;
    }
    return connects.status === 2 || connects.status == null;
  }

  isConnectProcessing(company: any): boolean {
    return !!this.getConnects(company)?.process;
  }

  isConnectRequested(company: any): boolean {
    const connects = this.getConnects(company);
    return !!connects && connects.status === 0 && !connects.process;
  }

  isConnectConnected(company: any): boolean {
    const connects = this.getConnects(company);
    return !!connects && connects.status === 1;
  }

  getConnectButtonLabel(company: any): string {
    return this.isConnectProcessing(company) ? 'Connecting...' : 'Connect';
  }

  get visibleCompanies(): any[] {
    if (this.activeTab === 'requests') {
      return this.asList(this.mediatorRequestedCompanies);
    }
    if (this.activeTab === 'rejected') {
      return this.asList(this.mediatorRejectedCompanies);
    }
    return this.asList(this.mediatorConnectedCompanies);
  }

  companyCount(list: any[] | null | undefined): number {
    return this.asList(list).length;
  }

  companyName(company: any): string {
    return company?.company_alias || company?.alias || '—';
  }

  companyInitials(company: any): string {
    const name = this.companyName(company).trim();
    if (!name || name === '—') {
      return '?';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  companyLogo(company: any): string | null {
    return this.getLogoUrl(company?.company_logo || company?.logo);
  }

  companyGroupLink(company: any): string | null {
    const link = company?.company_group_link || company?.group_link;
    return link ? String(link) : null;
  }

  companyProductCount(company: any): number | null {
    const value =
      company?.active_product_count ??
      company?.product_count ??
      company?.products_count ??
      company?.active_products;
    if (value == null || value === '') {
      return null;
    }
    const count = Number(value);
    return Number.isFinite(count) ? count : null;
  }

  openedCompany: any = null;

  companyDatePrefix(): string {
    if (this.activeTab === 'requests') {
      return 'Requested';
    }
    if (this.activeTab === 'rejected') {
      return 'Updated';
    }
    return 'Connected';
  }

  companyStatusLabel(): string {
    if (this.activeTab === 'requests') {
      return 'Request pending';
    }
    if (this.activeTab === 'rejected') {
      return 'rejected';
    }
    return 'connected';
  }

  emptyCompaniesLabel(): string {
    if (this.activeTab === 'requests') {
      return 'No requests companies.';
    }
    if (this.activeTab === 'rejected') {
      return 'No rejected companies.';
    }
    return 'No connected companies.';
  }

  openCompany(company: any): void {
    this.openedCompany = company;
    this.cdr.detectChanges();
  }

  closeCompany(): void {
    this.openedCompany = null;
    this.cdr.detectChanges();
  }

  private asList(data: any): any[] {
    return Array.isArray(data) ? data : [];
  }

  getMediatorConnectedCompanies(): void {
    this.apiService.getMediatorConnectedCompanies(this.token).subscribe(
      (res: any) => {
        console.log(res);
        this.mediatorConnectedCompanies = this.asList(res?.data);
        this.finishMediatorLoad();
      },
      (error: any) => {
        console.log(error);
        this.finishMediatorLoad();
      }
    );
  }
  getMediatorRequestedCompanies(): void {
    this.apiService.getMediatorRequestedCompanies(this.token).subscribe(
      (res: any) => {
        console.log(res);
        this.mediatorRequestedCompanies = this.asList(res?.data);
        this.finishMediatorLoad();
      },
      (error: any) => {
        console.log(error);
        this.finishMediatorLoad();
      }
    );
  }

  getMediatorRejectedCompanies(): void {
    this.apiService.getMediatorRejectedCompanies(this.token).subscribe(
      (res: any) => {
        console.log(res);
        this.mediatorRejectedCompanies = this.asList(res?.data);
        this.finishMediatorLoad();
      },
      (error: any) => {
        console.log(error);
        this.finishMediatorLoad();
      }
    );
  }

  get isCompanyRequestPage(): boolean {
    return this.router.url.includes('company-requests');
  }

  get requestItems(): { company: any; status: 'pending' | 'approved' | 'rejected' }[] {
    const pending = this.asList(this.mediatorRequestedCompanies).map((company) => ({ company, status: 'pending' as const }));
    const approved = this.asList(this.mediatorConnectedCompanies).map((company) => ({ company, status: 'approved' as const }));
    const rejected = this.asList(this.mediatorRejectedCompanies).map((company) => ({ company, status: 'rejected' as const }));
    return [...pending, ...approved, ...rejected];
  }

  get requestSummary(): { total: number; pending: number; approved: number; rejected: number } {
    const items = this.requestItems;
    return {
      total: items.length,
      pending: items.filter((item) => item.status === 'pending').length,
      approved: items.filter((item) => item.status === 'approved').length,
      rejected: items.filter((item) => item.status === 'rejected').length,
    };
  }

  get filteredRequests(): { company: any; status: 'pending' | 'approved' | 'rejected' }[] {
    const query = this.requestQuery.trim().toLowerCase();
    return this.requestItems.filter((item) => {
      if (this.requestFilter !== 'all' && item.status !== this.requestFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      const blob = `${this.companyName(item.company)} ${this.requestOrg(item.company)} ${this.requestNote(item.company)}`.toLowerCase();
      return blob.includes(query);
    });
  }

  setRequestFilter(filter: 'all' | 'pending' | 'approved' | 'rejected'): void {
    this.requestFilter = filter;
  }

  requestOrg(company: any): string {
    const value = company?.company_description || company?.description || company?.category;
    return value ? String(value) : '—';
  }

  requestLocation(company: any): string {
    const value = company?.location || company?.city || company?.address || company?.state;
    return value ? String(value) : '—';
  }

  requestType(company: any): string {
    const value = company?.type || company?.request_type;
    return value ? String(value) : 'Connection request';
  }

  requestPriority(company: any): string {
    const value = company?.priority;
    return value ? String(value) : '—';
  }

  requestDate(company: any): string | null {
    const value = company?.created_on || company?.requested_on || company?.updated_on;
    return value ? String(value) : null;
  }

  requestNote(company: any): string {
    const value = company?.summary || company?.company_description || company?.description;
    return value ? String(value) : '';
  }

  exportRequests(): void {
    const header = 'Name,Organization,Type,Location,Priority,Status,Requested At,Summary';
    const rows = this.requestItems.map((item) => {
      const cells = [
        this.companyName(item.company),
        this.requestOrg(item.company),
        this.requestType(item.company),
        this.requestLocation(item.company),
        this.requestPriority(item.company),
        item.status,
        this.requestDate(item.company) ?? '',
        this.requestNote(item.company),
      ];
      return cells.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',');
    });
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'company-requests.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private finishMediatorLoad(): void {
    this.mediatorLoadsPending -= 1;
    if (this.mediatorLoadsPending <= 0) {
      this.mediatorListsReady = true;
    }
    this.cdr.detectChanges();
  }
}
