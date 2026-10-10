import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Usercompanies } from './usercompanies';

describe('Usercompanies', () => {
  let component: Usercompanies;
  let fixture: ComponentFixture<Usercompanies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Usercompanies]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Usercompanies);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
