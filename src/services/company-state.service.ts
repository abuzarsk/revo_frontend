import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { STORAGE_KEYS } from '../constants/app.constants';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

/**
 * Service to manage globally selected company state
 * This service provides reactive updates when the selected company changes
 */
@Injectable({
  providedIn: 'root',
})
export class CompanyStateService {
  private platformId = inject(PLATFORM_ID);
  
  // BehaviorSubject to hold the current selected company ID
  private selectedCompanyIdSubject: BehaviorSubject<string | null>;
  
  // Observable that components can subscribe to for changes
  public selectedCompanyId$: Observable<string | null>;

  constructor() {
    // Initialize with value from localStorage if available, otherwise null
    const initialValue = this.loadFromStorage();
    this.selectedCompanyIdSubject = new BehaviorSubject<string | null>(initialValue);
    this.selectedCompanyId$ = this.selectedCompanyIdSubject.asObservable();
  }

  /**
   * Get the current selected company ID synchronously
   */
  getSelectedCompanyId(): string | null {
    return this.selectedCompanyIdSubject.value;
  }

  /**
   * Set the selected company ID globally
   * This will update all subscribers and persist to localStorage
   */
  setSelectedCompanyId(companyId: string | null): void {
    this.selectedCompanyIdSubject.next(companyId);
    this.saveToStorage(companyId);
  }

  /**
   * Load selected company ID from localStorage
   */
  private loadFromStorage(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_COMPANY_ID);
      return stored ? stored : null;
    } catch (error) {
      console.error('Error loading selected company ID from storage:', error);
      return null;
    }
  }

  /**
   * Save selected company ID to localStorage
   */
  private saveToStorage(companyId: string | null): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      if (companyId) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_COMPANY_ID, companyId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_COMPANY_ID);
      }
    } catch (error) {
      console.error('Error saving selected company ID to storage:', error);
    }
  }

  /**
   * Clear the selected company (useful on logout)
   */
  clearSelectedCompany(): void {
    this.setSelectedCompanyId(null);
  }
}
