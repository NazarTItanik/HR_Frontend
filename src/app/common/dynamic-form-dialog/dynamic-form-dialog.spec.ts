import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicFormDialogComponent } from './dynamic-form-dialog';

describe('DynamicFormDialog', () => {
  let component: DynamicFormDialogComponent;
  let fixture: ComponentFixture<DynamicFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
