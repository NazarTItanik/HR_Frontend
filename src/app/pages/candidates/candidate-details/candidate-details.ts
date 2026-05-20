import { Component, signal, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { SafePipe } from '../../../services/safe-pipe/safe.pipe';

// PrimeNG
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { Candidate } from '../../../models/Candidate';
import { LoadingService } from '../../../services/loading-service/loading-service';
import { ApiService } from '../../../services/api-service/api-service';
import { CandidateStage } from '../../../models/enums/candidateStage';
import { Notification } from '../../../services/notification/notification';
import { DynamicFormDialogComponent, DialogFieldConfig } from '../../../common/dynamic-form-dialog/dynamic-form-dialog';

@Component({
  selector: 'app-candidate-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AvatarModule,
    ButtonModule,
    InputTextModule,
    TabsModule,
    SelectModule,
    TooltipModule,
    SafePipe,
    DynamicFormDialogComponent,
  ],
  templateUrl: './candidate-details.html',
  styleUrls: ['./candidate-details.css']
})
export class CandidateDetailsComponent implements OnInit {

  employeeForm!: FormGroup;

  constructor(
    private api: ApiService,
    private loading: LoadingService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notification: Notification,
    private fb: FormBuilder,
  ) {
  }

  private route = inject(ActivatedRoute);

  activeTabValue: string = 'details';
  candidate = signal<Candidate | null>(null);
  candidateData: Candidate | null = null;

  stageOptions = Object.values(CandidateStage)
    .filter(s => isNaN(Number(s)))
    .map(s => ({ label: s as string, value: s }));

  selectedStage: CandidateStage | null = null;
  vacancies: { id: number, title: string }[] = [];
  selectedVacancy: number | undefined;
  currentVacancyTitle: string = '';
  resumeFile: File | null = null;
  resumeTimestamp = Date.now();

  // ── Add Employee Dialog ────────────────────────────────────────────
  showAddEmployeeDialog = false;

  workTypes = ['Full-Time', 'Part-Time', 'Contract', 'Internship', 'Remote'];

  employeeFields: DialogFieldConfig[] = [];

  // ──────────────────────────────────────────────────────────────────

  ngOnInit() {
    this.employeeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      hireDate: [null, Validators.required],
      vacancyId: [null, Validators.required],
      contactNumber: ['', [Validators.required, Validators.maxLength(100)]],
      baseSalary: [null, [Validators.required, Validators.min(0), Validators.max(1000000)]],
      workType: ['Full-Time', Validators.required],
    });
    this.onLoadVacancies();
    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.loadCandidate(id);
    } else {
      this.router.navigate(['/candidates']);
    }
  }

  openAddEmployeeDialog(candidate: Candidate): void {
    this.employeeForm.patchValue({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      contactNumber: candidate.contactNumber ?? '',
      vacancyId: candidate.vacancyId ?? null,
    });
    this.showAddEmployeeDialog = true;
  }

  onResumeSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.resumeFile = input.files[0];
    }
  }

  loadCandidate(id: string): void {
    this.loading.show();
    this.api.get<Candidate>(`api/Candidates/GetCandidate/${id}`).subscribe({
      next: (data) => {
        this.candidateData = data;
        this.candidate.set(data);
        this.selectedVacancy = this.vacancies.find(v => v.id === data.vacancyId)?.id;
        this.currentVacancyTitle = this.vacancies.find(v => v.id === data.vacancyId)?.title || '';
        this.selectedStage = data.stage;
        this.loading.hide();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load candidate:', err);
        this.loading.hide();
      }
    });
  }

  onLoadVacancies(): void {
    this.api.get<{ id: number, title: string }[]>('api/GetVacancies').subscribe({
      next: (data) => {
        this.vacancies = data;

        this.employeeFields = [
          {
            key: 'firstName', label: 'First Name', type: 'text', required: true, colSpan: 6,
            errorMessages: { maxlength: 'Max 100 characters.' }
          },
          {
            key: 'lastName', label: 'Last Name', type: 'text', required: true, colSpan: 6,
            errorMessages: { maxlength: 'Max 100 characters.' }
          },
          { key: 'email', label: 'Email', type: 'email', required: true, colSpan: 6 },
          {
            key: 'contactNumber', label: 'Contact Number', type: 'text', required: true, colSpan: 6,
            errorMessages: { maxlength: 'Max 100 characters.' }
          },
          { key: 'hireDate', label: 'Hire Date', type: 'date', required: true, colSpan: 6 },
          {
            key: 'vacancyId', label: 'Vacancy', type: 'select', required: true, colSpan: 6,
            options: this.vacancies, optionLabel: 'title', optionValue: 'id'
          },
          {
            key: 'baseSalary', label: 'Base Salary', type: 'number', required: true, colSpan: 6,
            numberMode: 'currency', currency: 'USD', min: 0, max: 1000000,
            errorMessages: { min: 'Salary must be positive.', max: 'Salary cannot exceed 1,000,000.' }
          },
          // {
          //   key: 'workType', label: 'Work Type', type: 'select', required: true, colSpan: 6,
          //   options: this.workTypes
          // },
        ];
      },
      error: (err) => console.error('Failed to load vacancies:', err)
    });
  }

  getResumeUrl(candidateId: string): string {
    return `http://localhost:5000/api/Candidates/${candidateId}/resume?t=${this.resumeTimestamp}`;
  }

  onEmployeeSaved(value: any): void {
    const payload = {
      ...value,
      hireDate: (value.hireDate as Date).toISOString().split('T')[0],
    };
    this.loading.show();
    this.api.post('api/Employees/CreateEmployee', payload).subscribe({
      next: () => {
        this.loading.hide();
        this.notification.success('Employee created successfully.');
      },
      error: () => {
        this.loading.hide();
        this.notification.error('Failed to create employee.');
      }
    });
  }

  onSave(): void {
    if (this.candidateData == null) return;
    const formData = new FormData();
    formData.append('firstName', this.candidateData?.firstName || '');
    formData.append('lastName', this.candidateData?.lastName || '');
    formData.append('email', this.candidateData?.email || '');
    formData.append('stage', this.selectedStage?.toString() || '');
    formData.append('resumeFile', this.resumeFile || '');

    if (this.candidateData?.middleName) formData.append('middleName', this.candidateData.middleName);
    if (this.candidateData?.contactNumber) formData.append('contactNumber', this.candidateData.contactNumber);
    if (this.selectedVacancy) formData.append('vacancyId', this.selectedVacancy.toString());

    this.loading.show();
    this.api.post(`api/Candidates/Update/${this.candidateData!.id}`, formData).subscribe({
      next: () => {
        this.loading.hide();
        this.resumeTimestamp = Date.now();
        this.notification.success('Candidate updated successfully.');
      },
      error: (err) => {
        this.loading.hide();
        this.notification.error('Failed to save candidate. Fill in all required fields and try again.');
        console.error('Failed to save candidate:', err);
      }
    });
  }

  onStageChange(): void {
    this.api.post(`api/Candidates/${this.candidateData!.id}/stage`, { stage: this.selectedStage })
      .subscribe({
        next: () => this.notification.success('Stage updated'),
        error: () => this.notification.error('Failed to update stage')
      });
  }

}