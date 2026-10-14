import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ensureMemberRole } from './member-role';

interface SupportTicket {
  id: string;
  subject: string;
  details: string;
  status: string;
  at: string;
}

const TICKET_KEY = 'revo-support-tickets-v1';

@Component({
  selector: 'app-member-support',
  imports: [CommonModule, FormsModule],
  templateUrl: './member-support.html',
  styleUrl: './member.css',
})
export class MemberSupport implements OnInit {
  subject = '';
  details = '';
  tickets: SupportTicket[] = [];
  error = '';
  message = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (!ensureMemberRole(this.router)) {
      return;
    }
    try {
      const raw = localStorage.getItem(TICKET_KEY);
      this.tickets = raw ? (JSON.parse(raw) as SupportTicket[]) : [];
    } catch {
      this.tickets = [];
    }
  }

  submit(): void {
    const subject = this.subject.trim();
    const details = this.details.trim();
    if (subject.length < 4 || details.length < 10) {
      this.error = 'Add a subject and at least 10 characters of detail.';
      this.message = '';
      return;
    }
    const ticket: SupportTicket = {
      id: `RVO-${Date.now().toString().slice(-6)}`,
      subject,
      details,
      status: 'Open',
      at: new Date().toISOString(),
    };
    this.tickets = [ticket, ...this.tickets];
    localStorage.setItem(TICKET_KEY, JSON.stringify(this.tickets));
    this.subject = '';
    this.details = '';
    this.error = '';
    this.message = 'Preview support request created.';
  }
}
