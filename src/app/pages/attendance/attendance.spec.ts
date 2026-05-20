import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendancesComponent } from './attendance';

describe('Attendance', () => {
  let component: AttendancesComponent;
  let fixture: ComponentFixture<AttendancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendancesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendancesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
