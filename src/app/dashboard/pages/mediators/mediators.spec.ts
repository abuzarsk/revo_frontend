import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mediators } from './mediators';

describe('Mediators', () => {
  let component: Mediators;
  let fixture: ComponentFixture<Mediators>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mediators]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mediators);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
