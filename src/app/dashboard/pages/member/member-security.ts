import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ensureWorkspaceRole, readRoleId, readStoredJson, workspaceLabel, writeStoredJson } from './member-role';
import { ENTITY_TYPE_IDS } from '../../../../constants';

const SECURITY_KEY = 'revo-security-member-v1';

@Component({
  selector: 'app-member-security',
  imports: [CommonModule, FormsModule],
  templateUrl: './member-security.html',
  styleUrl: './member.css',
})
export class MemberSecurity implements OnInit {
  twoStep = true;
  sessions = [
    { id: 'current', device: 'This device', location: 'Current browser', last: 'Active now', current: true },
    { id: 'mobile', device: 'Mobile browser', location: 'Bengaluru, India', last: 'Yesterday', current: false },
  ];

  constructor(private router: Router) {}

  readonly lede = `Security in ${workspaceLabel()}`;

  ngOnInit(): void {
    if (!ensureWorkspaceRole(this.router)) {
      return;
    }
    this.twoStep = readStoredJson(this.storageKey(), { twoStep: true }).twoStep;
  }

  toggleTwoStep(checked: boolean): void {
    this.twoStep = checked;
    writeStoredJson(this.storageKey(), { twoStep: checked });
  }

  private storageKey(): string {
    if (readRoleId() === ENTITY_TYPE_IDS.COMPANY) {
      return 'revo-security-company-v1';
    }
    if (readRoleId() === ENTITY_TYPE_IDS.MEDIATOR) {
      return 'revo-security-mediator-v1';
    }
    return SECURITY_KEY;
  }

  revoke(id: string): void {
    this.sessions = this.sessions.filter((item) => item.id !== id);
  }
}
