import { Component, computed, signal, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { ViewEncapsulation } from '@angular/core';
import { Table } from 'primeng/table';


import { Candidate, CreateCandidateDto } from '../../models/Candidate';
import { ApiService } from '../../services/api-service/api-service';
import { LoadingService } from '../../services/loading-service/loading-service';
import { delay } from 'rxjs';
import { CandidateStage } from '../../models/enums/candidateStage';
import { Router } from '@angular/router';
import { Notification } from '../../services/notification/notification';
import { DynamicFormDialogComponent, DialogFieldConfig } from '../../common/dynamic-form-dialog/dynamic-form-dialog';

// ─── Local Types ───────────────────────────────────────────────────────────────


export interface StageSummary {
  id: string;
  label: string;
  count: number;
  active: boolean;
}


// ─── Component ─────────────────────────────────────────────────────────────────

@Component({
  // encapsulation: ViewEncapsulation.None
  // ,
  selector: 'app-candidates',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    AvatarModule,
    InputTextModule,
    PopoverModule,
    SelectModule,
    DynamicFormDialogComponent
  ],
  templateUrl: './candidates.html',
  styleUrl: './candidates.css'
})
export class CandidatesComponent implements OnInit {


  employeeForm!: FormGroup;

  @ViewChild('dt', { static: false }) dt!: Table;


  // ── Dialog ─────────────────────────────────────────────────────────────────
  visible = false;

  // ── Vacancy filter ─────────────────────────────────────────────────────────
  searchQuery = 'all';

  vacancies: { id: number, title: string }[] = [];
  selectedVacancy: number | undefined;

  // ── Submission state ───────────────────────────────────────────────────────
  isSubmitting = false;
  submitError: string | null = null;

  // Default to 'All' instead of null
  activeStage = signal<string>('All');


  searchText = signal<string>('');

  selectedStage: CandidateStage | null = null;

  showAddEmployeeDialog = false;
  workTypes = ['Full-Time', 'Part-Time', 'Contract', 'Internship', 'Remote'];

  employeeFields: DialogFieldConfig[] = [];

  selectedCandidate: Candidate | null = null;

  onResumeSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.resumeFile = input.files[0];
      console.log('Selected file:', this.resumeFile);
    }
  }
  onStageChange(candidateId: string, newStage: any): void {
    this.api.post(`api/Candidates/${candidateId}/stage`, { stage: newStage })
      .subscribe({
        next: () => {
          this.notification.success('Stage updated');
          this.onLoadCandidates();
        },
        error: () => this.notification.error('Failed to update stage')
      });
  }

  openAddEmployeeDialog(candidate: Candidate): void {
    this.selectedCandidate = candidate;
    this.employeeForm.patchValue({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      contactNumber: candidate.contactNumber ?? '',
      vacancyId: candidate.vacancyId ?? null,
    });
    this.showAddEmployeeDialog = true;
  }


  stageOptions = Object.values(CandidateStage)
    .filter(s => isNaN(Number(s)))
    .map(s => ({ label: s as string, value: s }));

  ngOnInit(): void {
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
    this.onLoadCandidates();
    this.onLoadVacancies();

    // this.cities = [
    //   { name: 'Vacancy 1', id: '1' },
    //   { name: 'Vacancy 2', id: '2' },
    //   { name: 'Vacancy 3', id: '3' },
    //   { name: 'Vacancy 4', id: '4' },
    //   { name: 'Vacancy 5', id: '5' }
    // ];
  }

  // ── Stage options ──────────────────────────────────────────────────────────

  // ── Candidates (writable signal) ───────────────────────────────────────────
  // Используем Candidate из модели — id: string, stage: string
  private _candidates = signal<Candidate[]>([]);

  candidates = computed<Candidate[]>(() => {
    const stage = this.activeStage();
    const search = this.searchText().toLowerCase().trim();

    return this._candidates()
      // Modified: Return true if the stage is 'All' OR if it matches
      .filter(c => stage === 'All' || c.stage === stage)
      .map(c => ({ ...c, isEmployee: c.stage === CandidateStage.Hired }))
      .filter(c => {
        if (!search) return true;
        const full = `${c.firstName} ${c.lastName}`.toLowerCase();
        return full.includes(search);
      });
  });

  // ── Sidebar stage summary (computed) ──────────────────────────────────────
  stagesSummary = computed<StageSummary[]>(() => {
    const allCandidates = this._candidates();
    const currentStage = this.activeStage();

    // 1. Map the individual stages from the Enum
    const stages = Object.values(CandidateStage)
      .filter(s => isNaN(Number(s)))
      .map(stage => ({
        id: stage as string,
        label: stage as string,
        count: allCandidates.filter(c => c.stage === stage).length,
        active: currentStage === stage,
      }));

    // 2. Prepend the 'All Candidates' option to the array
    return [
      {
        id: 'All',
        label: 'All Candidates',
        count: allCandidates.length,
        active: currentStage === 'All'
      },
      ...stages
    ];
  });


  onLoadCandidates(): void {
    this.api.get<Candidate[]>('api/Candidates').subscribe({
      next: (data) => {
        this._candidates.set(data);
      },
      error: (err) => {
        console.error('Failed to load candidates:', err);
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
          {
            key: 'workType', label: 'Work Type', type: 'select', required: true, colSpan: 6,
            options: this.workTypes
          },
        ];
      },
      error: (err) => {
        console.error('Failed to load vacancies:', err);
      }
    });
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
        if (this.selectedCandidate) {
          this.api.delete(`api/Candidates/${this.selectedCandidate.id}`).subscribe({
            next: () => this.onLoadCandidates(),
            error: () => this.notification.error('Failed to delete candidate.')
          });
        }

      },
      error: () => {
        this.loading.hide();
        this.notification.error('Failed to create employee.');
      }
    });
  }

  selectStage(value: string): void {
    this.activeStage.set(value);
  }
  firstName = '';
  middleName = '';
  lastName = '';
  vacancyId = null;
  dateOfApplication = '';
  email = '';
  contactNumber = '';
  facebook = '';
  twitter = '';
  linkedIn = '';
  keywords = '';
  candidateSource = '';
  notes = '';
  resumeFile: File | null = null;  // соответствует resumeFile?: File в DTO

  constructor(private api: ApiService, private loading: LoadingService, private router: Router, private notification: Notification, private fb: FormBuilder,) { }

  // ── File select ────────────────────────────────────────────────────────────
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.resumeFile = input.files?.[0] ?? null;
  }

  // ── Open / close dialog ────────────────────────────────────────────────────
  openDialog(): void {
    this.resetForm();
    this.visible = true;
  }

  closeDialog(): void {
    this.visible = false;
    this.submitError = null;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  onSubmit(): void {
    this.submitError = null;
    this.loading.show();

    if (!this.firstName.trim() || !this.lastName.trim() || !this.email.trim()) {
      this.submitError = 'First Name, Last Name and Email are required.';
      this.loading.hide();
      return;
    }

    const formData = new FormData();
    formData.append('firstName', this.firstName.trim());
    formData.append('lastName', this.lastName.trim());
    formData.append('email', this.email.trim());

    if (this.middleName) formData.append('middleName', this.middleName.trim());
    if (this.selectedVacancy) formData.append('vacancyId', this.selectedVacancy.toString());
    if (this.dateOfApplication) formData.append('dateOfApplication', this.dateOfApplication);
    if (this.contactNumber) formData.append('contactNumber', this.contactNumber.trim());
    if (this.facebook) formData.append('facebook', this.facebook.trim());
    if (this.twitter) formData.append('twitter', this.twitter.trim());
    if (this.linkedIn) formData.append('linkedIn', this.linkedIn.trim());
    if (this.keywords) formData.append('keywords', this.keywords.trim());
    if (this.notes) formData.append('notes', this.notes.trim());
    if (this.resumeFile) formData.append('resumeFile', this.resumeFile);

    formData.append('stage', CandidateStage.New.toString());

    this.api
      .post<Candidate>('api/Candidates', formData)
      .subscribe({
        next: (data) => {
          this.onLoadCandidates();
          this.loading.hide();
          setTimeout(() => this.closeDialog(), 0);
        },
        error: (err) => {
          console.error('Validation errors:', err.error.errors); // ← add t
          console.error(err);
          this.loading.hide();
        }
      });
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  private resetForm(): void {
    this.firstName = '';
    this.middleName = '';
    this.lastName = '';
    this.selectedVacancy = undefined;
    this.dateOfApplication = '';
    this.email = '';
    this.contactNumber = '';
    this.facebook = '';
    this.twitter = '';
    this.linkedIn = '';
    this.keywords = '';
    this.candidateSource = '';
    this.notes = '';
    this.resumeFile = null;
    this.submitError = null;
  }

  editCandidate(candidate: Candidate): void {
    this.router.navigate(['/candidate-detail'], { queryParams: { id: candidate.id } });
  }

  sendEmail(candidate: Candidate): void {
    const subject = encodeURIComponent('Regarding your application');
    const body = encodeURIComponent(`Dear ${candidate.firstName} ${candidate.lastName},\n\n`);
    window.open(`mailto:${candidate.email}?subject=${subject}&body=${body}`);
  }

  deleteCandidate(candidate: Candidate): void {
    this.api.delete(`api/Candidates/${candidate.id}`).subscribe({
      next: () => {
        this.onLoadCandidates();
      },
      error: (err) => {
        console.error('Failed to delete candidate:', err);
      }
    });
  }

  exportToCSV(): void {
    const data = this.candidates();

    const headers = ['First Name', 'Last Name', 'Email', 'Contact Number', 'Date Applied', 'Stage'];
    const rows = data.map(c => [
      c.firstName,
      c.lastName,
      c.email,
      c.contactNumber ?? '',
      c.dateOfApplication ?? '',
      c.stage ?? ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'candidates.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}