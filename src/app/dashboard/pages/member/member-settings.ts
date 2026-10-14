import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ensureWorkspaceRole, readRoleId, readStoredJson, workspaceLabel, writeStoredJson } from './member-role';
import { ENTITY_TYPE_IDS } from '../../../../constants';

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

  readonly lede = `Settings in ${workspaceLabel()}`;

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (!ensureWorkspaceRole(this.router)) {
      return;
    }
    this.settings = readStoredJson(this.storageKey(), this.settings);
  }

  update(key: 'emailNotices' | 'productUpdates' | 'compactView', value: boolean): void {
    this.settings = { ...this.settings, [key]: value };
    writeStoredJson(this.storageKey(), this.settings);
  }

  setLanguage(value: string): void {
    this.settings = { ...this.settings, language: value };
    writeStoredJson(this.storageKey(), this.settings);
  }

  private storageKey(): string {
    if (readRoleId() === ENTITY_TYPE_IDS.COMPANY) {
      return 'revo-preferences-company-v1';
    }
    if (readRoleId() === ENTITY_TYPE_IDS.MEDIATOR) {
      return 'revo-preferences-mediator-v1';
    }
    return SETTINGS_KEY;
  }
}
