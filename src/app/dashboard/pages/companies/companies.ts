import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  ENTITY_TYPE_IDS: any = ENTITY_TYPE_IDS;

  constructor(private apiService: Apiservice, private cdr: ChangeDetectorRef) {
    this.tokenObj = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ);
    this.role = this.tokenObj?.user?.default_role ?? null;
    this.token = this.tokenObj?.token ?? null;
  }

  ngOnInit(): void {
    //console.log(this.token);

    this.getCompaniesData();
  }

  getCompaniesData(): void {
    if(this.role == 1){
      this.getCompanies(this.token);
      this.getCompanyRequests(this.token);
      this.setTab('companies');
    }else if(this.role ==3){
      this.setTab('companies');
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

  getMediatorConnectedCompanies(): void {
    this.apiService.getMediatorConnectedCompanies(this.token).subscribe(
      (res: any) => {
        console.log(res);
        this.mediatorConnectedCompanies = res.data;
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.log(error);
      }
    );
  }
  getMediatorRequestedCompanies(): void {
    this.apiService.getMediatorRequestedCompanies(this.token).subscribe(
      (res: any) => {
        console.log(res);
        this.mediatorRequestedCompanies = res.data;
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.log(error);
      }
    );
  }

  getMediatorRejectedCompanies(): void {
    this.apiService.getMediatorRejectedCompanies(this.token).subscribe(
      (res: any) => {
        console.log(res);
        this.mediatorRejectedCompanies = res.data;
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.log(error);
      }
    );
  }
}
