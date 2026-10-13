import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ensureMemberRole, readStoredJson, writeStoredJson } from './member-role';

interface MemberSettingsData {
  emailNotices: boolean;
  productUpdates: boolean;
  compactView: boolean;
  language: string;
}

const SETTINGS_KEY = 'revo-preferences-member-v1';

@Component({
  selector: 'app-member-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './member-settings.html',
  styleUrl: './member.css',
})
export class MemberSettings implements OnInit {
  settings: MemberSettingsData = {
    emailNotices: true,
    productUpdates: true,
    compactView: false,
    language: 'English',
  };
  message = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (!ensureMemberRole(this.router)) {
      return;
    }
    this.settings = readStoredJson(SETTINGS_KEY, this.settings);
  }

  update(key: 'emailNotices' | 'productUpdates' | 'compactView', value: boolean): void {
    this.settings = { ...this.settings, [key]: value };
    writeStoredJson(SETTINGS_KEY, this.settings);
    this.message = 'Preferences saved in this browser.';
  }

  setLanguage(value: string): void {
    this.settings = { ...this.settings, language: value };
    writeStoredJson(SETTINGS_KEY, this.settings);
    this.message = 'Preferences saved in this browser.';
  }
}
