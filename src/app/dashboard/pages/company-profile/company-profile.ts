import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ENTITY_TYPE_IDS, getTokenFromLocalStorage, STORAGE_KEYS } from '../../../../constants';
import { readRoleId, readStoredJson, workspaceLabel, writeStoredJson } from '../member/member-role';

interface CompanyProfileData {
  name: string;
  website: string;
  industry: string;
  supportEmail: string;
  description: string;
}

const PROFILE_KEY = 'revo-company-profile-v1';

@Component({
  selector: 'app-company-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './company-profile.html',
  styleUrl: './company-profile.css',
})
export class CompanyProfile implements OnInit {
  profile: CompanyProfileData = this.blank();
  saved = '';
  message = '';
  error = '';
  readonly lede = `Company Profile in ${workspaceLabel()}`;

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (readRoleId() !== ENTITY_TYPE_IDS.COMPANY) {
      this.router.navigateByUrl('/');
      return;
    }
    const user = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.user ?? {};
    const stored = readStoredJson(PROFILE_KEY, this.blank());
    this.profile = {
      ...this.blank(),
      name: stored.name || user.company_name || user.company || user.name || '',
      website: stored.website || '',
      industry: stored.industry || '',
      supportEmail: stored.supportEmail || user.email || '',
      description: stored.description || '',
    };
    this.saved = JSON.stringify(this.profile);
  }

  get dirty(): boolean {
    return JSON.stringify(this.profile) !== this.saved;
  }

  save(): void {
    const name = this.profile.name.trim();
    const supportEmail = this.profile.supportEmail.trim();
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
      this.error = 'Enter a company name and valid support email.';
      this.message = '';
      return;
    }
    this.profile = {
      ...this.profile,
      name,
      website: this.profile.website.trim(),
      industry: this.profile.industry.trim(),
      supportEmail: supportEmail.toLowerCase(),
      description: this.profile.description.trim(),
    };
    writeStoredJson(PROFILE_KEY, this.profile);
    this.saved = JSON.stringify(this.profile);
    this.error = '';
    this.message = 'Company profile saved in this browser.';
  }

  private blank(): CompanyProfileData {
    return { name: '', website: '', industry: '', supportEmail: '', description: '' };
  }
}
