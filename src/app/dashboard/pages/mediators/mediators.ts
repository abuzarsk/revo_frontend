import { Component , ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Apiservice } from '../../../../services/apiservice';
import { getTokenFromLocalStorage, STORAGE_KEYS, ENTITY_TYPE_IDS } from '../../../../constants';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-mediators',
  imports: [CommonModule],
  templateUrl: './mediators.html',
  styleUrl: './mediators.css',
})
export class Mediators {

  readonly imageBaseUrl = environment.imageBaseUrl;

  token: any;
  mediatorsList: any[] = [];
  loading = false;
  role: any;
  ENTITY_TYPE_IDS: any = ENTITY_TYPE_IDS;

  /** Company (non-admin) view: filter and search */
  mediatorFilter: 'all' | 'active' | 'requested' | 'rejected' = 'all';
  mediatorQuery = '';
  companyMediatorsList: any[] = [];
  requestedMediatorsList: any[] = [];
  rejectedMediatorsList: any[] = [];
  loadingCompanyMediators = false;
  private companyLoadsPending = 0;

  constructor(private apiService: Apiservice, private cdr: ChangeDetectorRef) {
    const tokenObj = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ);
    this.role = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE);
    //console.log(tokenObj
    this.token = tokenObj?.token ?? null;
   
  }

  ngOnInit(): void {
    console.log(this.role+"="+ENTITY_TYPE_IDS.ADMIN);
    if (this.role == ENTITY_TYPE_IDS.ADMIN) {
      this.loadMediators();
    } else {
      this.loadCompanyMediatorTabs();
    }
  }

  setMediatorFilter(filter: 'all' | 'active' | 'requested' | 'rejected'): void {
    this.mediatorFilter = filter;
  }

  get portalLabel(): string {
    if (this.role == ENTITY_TYPE_IDS.COMPANY) {
      return 'Brand Center';
    }
    if (this.role == ENTITY_TYPE_IDS.MEDIATOR) {
      return 'Partner Hub';
    }
    if (this.role == ENTITY_TYPE_IDS.USER) {
      return 'Member Portal';
    }
    return 'workspace';
  }

  get visibleMediators(): any[] {
    const query = this.mediatorQuery.trim().toLowerCase();
    let rows = [
      ...this.tagMediators(this.companyMediatorsList, 'active'),
      ...this.tagMediators(this.requestedMediatorsList, 'requested'),
      ...this.tagMediators(this.rejectedMediatorsList, 'rejected'),
    ];
    if (this.mediatorFilter !== 'all') {
      rows = rows.filter((row) => row._status === this.mediatorFilter);
    }
    if (!query) {
      return rows;
    }
    return rows.filter((row) => {
      const name = this.mediatorName(row).toLowerCase();
      const subtitle = this.mediatorSubtitle(row).toLowerCase();
      return name.includes(query) || subtitle.includes(query);
    });
  }

  /** Load connected, requested, and rejected mediators for the company view */
  loadCompanyMediatorTabs(): void {
    if (!this.token) return;
    this.loadingCompanyMediators = true;
    this.companyLoadsPending = 3;
    this.companyMediatorsList = [];
    this.requestedMediatorsList = [];
    this.rejectedMediatorsList = [];
    this.getMediatorConnectedCompanies();
    this.getMediatorRequestedCompanies();
    this.getMediatorRejectedCompanies();
  }

  private finishCompanyLoad(): void {
    this.companyLoadsPending = Math.max(0, this.companyLoadsPending - 1);
    this.loadingCompanyMediators = this.companyLoadsPending > 0;
    this.cdr.detectChanges();
  }

  loadMediators(): void {
    if (!this.token) return;
    this.loading = true;
    this.apiService.getMediators(this.token, 1).subscribe({
      next: (res: any) => {
        this.mediatorsList = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  /** Profile/logo URL: use as-is if absolute, else prepend imageBaseUrl */
  getLogoUrl(logo: string | null | undefined): string | null {
    if (!logo) return null;
    if (logo.startsWith('http://') || logo.startsWith('https://')) return logo;
    const base = this.imageBaseUrl.endsWith('/') ? this.imageBaseUrl : this.imageBaseUrl + '/';
    return base + 'mediators/' + (logo.startsWith('/') ? logo.slice(1) : logo);
  }


  getMediatorConnectedCompanies(): void {
    this.companyMediatorsList = [];
    this.apiService.getCompaniesConnectedMediator(this.token).subscribe(
      (res: any) => {
        console.log(res);
        
        this.companyMediatorsList = this.asList(res?.data);
        this.finishCompanyLoad();
      },
      (error: any) => {
        console.log(error);
        this.finishCompanyLoad();
      }
    );
  }
  getMediatorRequestedCompanies(): void {
    this.requestedMediatorsList = [];
    this.apiService.getCompaniesRequestedMediator(this.token).subscribe(
      (res: any) => {
        console.log(res);
        this.requestedMediatorsList = this.asList(res?.data);
        this.finishCompanyLoad();
      },
      (error: any) => {
        console.log(error);
        this.finishCompanyLoad();
      }
    );
  }

  getMediatorRejectedCompanies(): void {
    this.rejectedMediatorsList = [];
    this.apiService.getCompaniesRejectedMediator(this.token).subscribe(
      (res: any) => {
        console.log(res);
        this.rejectedMediatorsList = this.asList(res?.data);
        this.finishCompanyLoad();
      },
      (error: any) => {
        console.log(error);
        this.finishCompanyLoad();
      }
    );
  }


  mediatorName(row: any): string {
    return row?.user?.mediator_alias || row?.mediator_alias || row?.alias || '—';
  }

  mediatorSubtitle(row: any): string {
    const text = row?.mediator_description || row?.description;
    return text ? String(text) : 'No description';
  }

  mediatorInitials(row: any): string {
    const name = this.mediatorName(row).trim();
    if (!name || name === '—') {
      return '?';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  mediatorStatusLabel(status: string): string {
    if (status === 'active') {
      return 'Active';
    }
    if (status === 'requested') {
      return 'Requested';
    }
    return 'Rejected';
  }

  private tagMediators(list: any[] | null | undefined, status: 'active' | 'requested' | 'rejected'): any[] {
    return this.asList(list).map((row) => ({ ...row, _status: status }));
  }

  private asList(data: any): any[] {
    return Array.isArray(data) ? data : [];
  }

  rejectMediatorRequest(row: any): void {
    if (!this.token) return;
    const mediatorId =
      row?.mediator_id ??
      row?.revo_mediator_id ??
      row?.mediator?.id ??
      row?.id;
    if (mediatorId == null) {
      console.warn('rejectMediatorRequest: missing mediator id on row', row);
      return;
    }

    

    this.update(mediatorId, 2, 'Rejected');
  }

  /** Accept a pending mediator request (company approves connection). */
  acceptMediatorRequest(row: any): void {
    if (!this.token) return;
    const mediatorId =
      row?.mediator_id ??
      row?.revo_mediator_id ??
      row?.mediator?.id ??
      row?.id;
    if (mediatorId == null) {
      console.warn('acceptMediatorRequest: missing mediator id on row', row);
      return;
    }
    this.update(mediatorId, 1, 'Accepted');

  }

  update(mediatorId:any,status:any,note:any){
    const data = {
      status: status,
      mediator_id: mediatorId,
      note: note,
    }
    this.apiService.verifyMediator(this.token, data).subscribe({
      next: () => {
        this.getMediatorRequestedCompanies();
        this.getMediatorConnectedCompanies();
        this.getMediatorRejectedCompanies();
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err),
    });
  }
}
