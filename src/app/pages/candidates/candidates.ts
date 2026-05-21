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
import { BadgeModule } from 'primeng/badge';


import { Candidate, CreateCandidateDto } from '../../models/Candidate';
import { ApiService } from '../../services/api-service/api-service';
import { LoadingService } from '../../services/loading-service/loading-service';
import { CandidateStage } from '../../models/enums/candidateStage';
import { Router } from '@angular/router';
import { Notification } from '../../services/notification/notification';
import { DynamicFormDialogComponent, DialogFieldConfig } from '../../common/dynamic-form-dialog/dynamic-form-dialog';
import { BulkAction } from '../../models/BulkAction';
import { BulkPopoverComponent } from '../../common/bulk-toolbar-component/bulk-toolbar-component';
import { Badge } from 'primeng/badge';

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
    DynamicFormDialogComponent,
    BulkPopoverComponent,
    Badge
  
  ],
  templateUrl: './candidates.html',
  styleUrl: './candidates.css'
})
export class CandidatesComponent implements OnInit {


  employeeForm!: FormGroup;

  bulkActions: BulkAction[] = [];

  selectedCandidates: Candidate[] = [];

  @ViewChild('dt', { static: false }) dt!: Table;

  // ── Vacancy filter ─────────────────────────────────────────────────────────
  searchQuery = 'all';

  vacancies: { id: number, title: string }[] = [];
  selectedVacancy: number | undefined;

  // Default to 'All' instead of null
  activeStage = signal<string>('All');


  searchText = signal<string>('');

  selectedStage: CandidateStage | null = null;

  showAddEmployeeDialog = false;
  workTypes = ['Full-Time', 'Part-Time', 'Contract', 'Internship', 'Remote'];

  employeeFields: DialogFieldConfig[] = [];

  selectedCandidate: Candidate | null = null;


  candidateFields: DialogFieldConfig[] = [];
  candidateForm!: FormGroup;
  showAddCandidateDialog = false;

  bulkMailForm!: FormGroup;
  bulkMailFields: DialogFieldConfig[] = [];
  showBulkMailDialog = false;
  pendingMailIds: string[] = [];


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
    this.bulkActions = [
      {
        label: 'Bulk mail',
        icon: 'pi pi-envelope',
        severity: 'secondary',
        execute: (ids) => this.onBulkMailSelected(ids)
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        severity: 'danger', // Сразу станет красным
        execute: (ids) => this.onDeleteSelected(ids)
      }
    ];
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

    this.candidateForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      middleName: [''],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      vacancyId: [null],
      dateOfApplication: [null],
      email: ['', [Validators.required, Validators.email]],
      contactNumber: [''],
      facebook: [''],
      twitter: [''],
      linkedIn: [''],
      keywords: [''],
      resumeFile: [null],
      notes: [''],
    });

    this.bulkMailForm = this.fb.group({
      subject: ['', Validators.required],
      body: ['', Validators.required],
    });

    this.bulkMailFields = [
      { key: 'subject', label: 'Subject', type: 'text', required: true, colSpan: 12 },
      { key: 'body', label: 'Body', type: 'textarea', required: true, colSpan: 12, rows: 6 },
    ];
  }
  onDeleteSelected(ids: string[]): void {
    this.loading.show();
    this.api.post('api/Candidates/delete-multiple', ids).subscribe({
      next: () => {
        this.loading.hide();
        this.selectedCandidates = [];
        this.notification.success(`${ids.length} candidate(s) deleted successfully`);
        this.onLoadCandidates();
      },
      error: () => {
        this.loading.hide();
        this.notification.error('Failed to delete selected candidates');
      }
    });
  }
  onBulkMailSelected(ids: string[]): void {
    this.pendingMailIds = ids;
    this.bulkMailForm.reset();
    this.showBulkMailDialog = true;
  }

  onBulkMailSaved(value: any): void {
    this.notification.success(`Email sent to ${this.pendingMailIds.length} candidate(s).`);
    this.pendingMailIds = [];
  }

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

        this.candidateFields = [
          { key: 'firstName', label: 'First Name', type: 'text', required: true, colSpan: 4, errorMessages: { maxlength: 'Max 100 characters.' } },
          { key: 'middleName', label: 'Middle Name', type: 'text', required: false, colSpan: 4 },
          { key: 'lastName', label: 'Last Name', type: 'text', required: true, colSpan: 4, errorMessages: { maxlength: 'Max 100 characters.' } },
          { key: 'vacancyId', label: 'Vacancy', type: 'select', required: false, colSpan: 4, options: this.vacancies, optionLabel: 'title', optionValue: 'id' },
          { key: 'dateOfApplication', label: 'Date of Application', type: 'date', required: false, colSpan: 4 },
          { key: 'email', label: 'Email', type: 'email', required: true, colSpan: 4 },
          { key: 'contactNumber', label: 'Contact Number', type: 'text', required: false, colSpan: 4 },
          { key: 'facebook', label: 'Facebook', type: 'text', required: false, colSpan: 4 },
          { key: 'twitter', label: 'X (Twitter)', type: 'text', required: false, colSpan: 4 },
          { key: 'linkedIn', label: 'LinkedIn', type: 'text', required: false, colSpan: 4 },
          { key: 'keywords', label: 'Keywords', type: 'text', required: false, colSpan: 4, placeholder: 'Enter comma separated words' },
          { key: 'resumeFile', label: 'Resume', type: 'file', required: false, colSpan: 4, accept: '.pdf' },
          { key: 'notes', label: 'Notes', type: 'textarea', required: false, colSpan: 12, placeholder: 'Enter any other notes about the candidate' },
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

  constructor(private api: ApiService, private loading: LoadingService, private router: Router, private notification: Notification, private fb: FormBuilder,) { }

  openDialog(): void {
    this.showAddCandidateDialog = true;
  }

  onCandidateSaved(value: any): void {
    this.loading.show();

    const formData = new FormData();
    formData.append('firstName', value.firstName.trim());
    formData.append('lastName', value.lastName.trim());
    formData.append('email', value.email.trim());

    if (value.middleName) formData.append('middleName', value.middleName.trim());
    if (value.vacancyId) formData.append('vacancyId', value.vacancyId.toString());
    if (value.dateOfApplication) formData.append('dateOfApplication', (value.dateOfApplication as Date).toISOString().split('T')[0]);
    if (value.contactNumber) formData.append('contactNumber', value.contactNumber.trim());
    if (value.facebook) formData.append('facebook', value.facebook.trim());
    if (value.twitter) formData.append('twitter', value.twitter.trim());
    if (value.linkedIn) formData.append('linkedIn', value.linkedIn.trim());
    if (value.keywords) formData.append('keywords', value.keywords.trim());
    if (value.notes) formData.append('notes', value.notes.trim());
    if (value.resumeFile instanceof File) formData.append('resumeFile', value.resumeFile);

    formData.append('stage', CandidateStage.New.toString());

    this.api.post<Candidate>('api/Candidates', formData).subscribe({
      next: () => {
        this.loading.hide();
        this.notification.success('Candidate added successfully.');
        this.onLoadCandidates();
      },
      error: () => {
        this.loading.hide();
        this.notification.error('Failed to add candidate.');
      }
    });
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