import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nothing } from './nothing';

describe('Nothing', () => {
  let component: Nothing;
  let fixture: ComponentFixture<Nothing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nothing],
    }).compileComponents();

    fixture = TestBed.createComponent(Nothing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
