import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkToolbarComponent } from './bulk-toolbar-component';

describe('BulkToolbarComponent', () => {
  let component: BulkToolbarComponent;
  let fixture: ComponentFixture<BulkToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkToolbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BulkToolbarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
