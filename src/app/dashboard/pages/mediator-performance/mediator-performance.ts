import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ENTITY_TYPE_IDS } from '../../../../constants';
import { readRoleId } from '../member/member-role';

@Component({
  selector: 'app-mediator-performance',
  imports: [],
  templateUrl: './mediator-performance.html',
  styleUrl: './mediator-performance.css',
})
export class MediatorPerformance implements OnInit {
  readonly stats = [
    { label: 'Completed earnings', value: '₹7,380' },
    { label: 'Approved submissions', value: '50' },
    { label: 'Approval rate', value: '41%' },
  ];
  readonly products = [
    { name: 'Wireless Headphone', detail: '20 submissions · 100% capacity', percent: 100 },
    { name: 'Smart Watch', detail: '20 submissions · 100% capacity', percent: 100 },
    { name: 'Power Bank 20000mAh', detail: '20 submissions · 100% capacity', percent: 100 },
    { name: 'Face Serum', detail: '21 submissions · 100% capacity', percent: 100 },
    { name: 'Running Shoes', detail: '20 submissions · 0% capacity', percent: 0 },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (readRoleId() !== ENTITY_TYPE_IDS.MEDIATOR) {
      this.router.navigateByUrl('/');
    }
  }
}
