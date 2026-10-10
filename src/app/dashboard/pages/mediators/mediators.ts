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

  /** Company (non-admin) view: tab state */
  activeMediatorTab: 'mediators' | 'requested' | 'rejected' = 'mediators';
  companyMediatorsList: any[] = [];
  requestedMediatorsList: any[] = [];
  rejectedMediatorsList: any[] = [];
  loadingCompanyMediators = false;

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

  setMediatorTab(tab: 'mediators' | 'requested' | 'rejected'): void {
    this.activeMediatorTab = tab;
    if (tab === 'mediators') {
      this.getMediatorConnectedCompanies();
    } else if (tab === 'requested') {
      this.getMediatorRequestedCompanies();
    } else if (tab === 'rejected') {
      this.getMediatorRejectedCompanies();
    }
  }

  /** Load lists for company tabs when backend endpoints are available */
  loadCompanyMediatorTabs(): void {
    if (!this.token) return;
    this.loadingCompanyMediators = true;
    // Wire these when API paths exist; placeholders keep UI working
    this.companyMediatorsList = [];
    this.requestedMediatorsList = [];
    this.rejectedMediatorsList = [];
    this.loadingCompanyMediators = false;
    this.getMediatorConnectedCompanies();
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
        
        this.companyMediatorsList = res.data;
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.log(error);
      }
    );
  }
  getMediatorRequestedCompanies(): void {
    this.requestedMediatorsList = [];
    this.apiService.getCompaniesRequestedMediator(this.token).subscribe(
      (res: any) => {
        console.log(res);
        this.requestedMediatorsList = res.data;
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.log(error);
      }
    );
  }

  getMediatorRejectedCompanies(): void {
    this.rejectedMediatorsList = [];
    this.apiService.getCompaniesRejectedMediator(this.token).subscribe(
      (res: any) => {
        console.log(res);
        this.rejectedMediatorsList = res.data;
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.log(error);
      }
    );
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
