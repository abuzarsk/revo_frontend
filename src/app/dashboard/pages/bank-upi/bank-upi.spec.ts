import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankUpi } from './bank-upi';

describe('BankUpi', () => {
  let component: BankUpi;
  let fixture: ComponentFixture<BankUpi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankUpi],
    }).compileComponents();

    fixture = TestBed.createComponent(BankUpi);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
