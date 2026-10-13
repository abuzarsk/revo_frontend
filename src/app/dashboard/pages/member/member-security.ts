import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ensureMemberRole, readStoredJson, writeStoredJson } from './member-role';

const SECURITY_KEY = 'revo-security-member-v1';

@Component({
  selector: 'app-member-security',
  imports: [CommonModule, FormsModule],
  templateUrl: './member-security.html',
  styleUrl: './member.css',
})
export class MemberSecurity implements OnInit {
  twoStep = true;
  message = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (!ensureMemberRole(this.router)) {
      return;
    }
    this.twoStep = readStoredJson(SECURITY_KEY, { twoStep: true }).twoStep;
  }

  toggleTwoStep(checked: boolean): void {
    this.twoStep = checked;
    writeStoredJson(SECURITY_KEY, { twoStep: checked });
    this.message = `Two-step preference ${checked ? 'turned on' : 'turned off'} in this browser. Sign-in still uses your password.`;
  }
}
