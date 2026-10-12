import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Apiservice } from '../../../../services/apiservice';
import { getTokenFromLocalStorage, STORAGE_KEYS } from '../../../../constants';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-usercompanies',
  imports: [CommonModule, FormsModule],
  templateUrl: './usercompanies.html',
  styleUrl: './usercompanies.css',
})
export class Usercompanies implements OnInit {

  readonly imageBaseUrl = environment.imageBaseUrl;

  token: any;
  tokenObj: any;
  showConnectOverlay = false;
  connectSearch = '';
  connectResults: any[] = [];
  userConnections: any[] = [];

  constructor(
    private apiService: Apiservice,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.tokenObj = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ);
    this.token = this.tokenObj?.token ?? null;
    this.getUserConnections();
  }

  openConnect(): void {
    this.showConnectOverlay = true;
    this.connectSearch = '';
    this.connectResults = [];
  }

  closeConnect(): void {
    this.showConnectOverlay = false;
  }

  searchCompanies(): void {
    const term = this.connectSearch.trim().toLowerCase();
    if (!term) {
      this.connectResults = [];
      this.cdr.detectChanges();
      return;
    }
    this.searchbyalias(term);
  }

  getCompanySearch(alias: string): void {
    if (!this.token) return;
    this.apiService.getCompanySearch(this.token, alias).subscribe({
      next: (res: any) => {
        const data = res?.data;
        this.connectResults = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
        this.connectResults = [];
        this.cdr.detectChanges();
      },
    });
  }

  revoConnect(data: any): void {
    console.log(data);
    if (!this.token) return;
    var obj = {
      company: (data.role==2) ? data.id : -1,
      mediator: (data.role==3) ? data.id : -1,
      note: '',
    };
    this.apiService.revoConnect(this.token,obj).subscribe({
      next: () => {
        this.searchCompanies();
        this.getUserConnections();
        this.closeConnect();
        this.cdr.detectChanges();
      },
      error: (err: any) => console.log(err),
    });
  }

  getCompanyLogoSrc(c: any): string {
    const logo = c?.logo;
    if (!logo) return '';
    const base = this.imageBaseUrl.endsWith('/') ? this.imageBaseUrl : `${this.imageBaseUrl}/`;
    if (logo.startsWith('http://') || logo.startsWith('https://')) return logo;
    return `${base}companies/${logo.startsWith('/') ? logo.slice(1) : logo}`;
  }



  searchbyalias(alias:any): void {
    this.apiService.searchbyalias(this.token,alias).subscribe(
      (res: any) => {
        console.log(res);
        this.connectResults = Array.isArray(res?.data) ? res.data : [];
        this.cdr.detectChanges();

      },
      (error: any) => {
        console.log(error);
      }
    );
  }

  getUserConnections(): void {
    if (!this.token) {
      return;
    }
    this.apiService.getUserConnections(this.token).subscribe(
      (res: any) => {
        const data = res?.data?.data ?? res?.data ?? res ?? [];
        this.userConnections = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.log(error);
        this.userConnections = [];
        this.cdr.detectChanges();
      }
    );
  }

  disconnect(c: any): void {

    if (!confirm('Are you sure you want to disconnect this company?')) return;
    var obj = {
      "id": c.revo_connect_id,
      "company_id": c.company_id,
      "mediator_id": c.mediator_id,
      "user_id": c.user_id,
      "status": 2,
      "note": c.revo_connect_note,
    };

    this.apiService.updateUserConnections(this.token,obj).subscribe({
      next: () => {
        this.getUserConnections();
        
      },
      error: (err: any) => console.log(err),
    });
    
  }
}
