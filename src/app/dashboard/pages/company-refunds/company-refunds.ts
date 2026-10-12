import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-company-refunds',
  imports: [CommonModule, FormsModule],
  templateUrl: './company-refunds.html',
  styleUrls: ['../company-portal/company-portal.css'],
})
export class CompanyRefunds {
  query = '';
  status = 'all';

  readonly pills = [
    { value: 'all', label: 'All' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'processing', label: 'Processing' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  readonly stats = [
    { label: 'Orders', value: '0' },
    { label: 'Order value', value: '₹0' },
    { label: 'Refunds issued', value: '₹0' },
    { label: 'In transit', value: '0' },
  ];

  exportCsv(): void {
    const header = 'Order,Date,Product,Brand,Company,Member,Channel,Amount,Refund,Status\n';
    const blob = new Blob([header], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'revo-company-orders.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
