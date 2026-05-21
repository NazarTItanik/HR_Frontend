import { Component, computed, signal, OnInit, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { MenuItem } from 'primeng/api';
import { PopoverModule } from 'primeng/popover';
import { Vacancy } from '../../models/Vacancy';
import { Employee } from '../../models/Employee';

import { ApiService } from '../../services/api-service/api-service';
import { Router } from '@angular/router';
import { LoadingService } from '../../services/loading-service/loading-service';
import { Notification } from '../../services/notification/notification';
import { DynamicFormDialogComponent, DialogFieldConfig } from '../../common/dynamic-form-dialog/dynamic-form-dialog';
import { BulkPopoverComponent } from '../../common/bulk-toolbar-component/bulk-toolbar-component';
import { BulkAction } from '../../models/BulkAction';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.html',
  styleUrl: "./employees.css",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    SelectButtonModule,
    SelectModule,
    AvatarModule,
    MenuModule,
    DialogModule,
    PopoverModule,
    DynamicFormDialogComponent,
    BulkPopoverComponent
  ]
})
export class EmployeesComponent implements OnInit {

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private loading: LoadingService,
    private router: Router,
    private notification: Notification,
    private cdr: ChangeDetectorRef
  ) { }

  private _employees = signal<Employee[]>([]);
  selectedEmployees: Employee[] = [];

  // Dialog state
  createDialogVisible = false;
  submitting = false;

  // Form
  employeeForm!: FormGroup;

  employeeFields: DialogFieldConfig[] = [];

  vacancyOptions: Vacancy[] = [];

  bulkActions: BulkAction[] = [];

  bulkMailForm!: FormGroup;
  bulkMailFields: DialogFieldConfig[] = [];
  showBulkMailDialog = false;
  pendingMailIds: string[] = [];

  workTypeOptions = [
    { label: 'Full-Time', value: 'FullTime' },
    { label: 'Part-Time', value: 'PartTime' },
    { label: 'Freelance', value: 'Freelance' },
    { label: 'Contract', value: 'Contract' },
    { label: 'Intern', value: 'Intern' }
  ];

  wageTypeOptions = [
    { label: 'Monthly Base', value: 'Monthly' },
    { label: 'Hourly Rate', value: 'Hourly' },
    { label: 'Weekly Base', value: 'Weekly' }
  ];

  statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Probation', value: 'Probation' },
    { label: 'Inactive', value: 'Inactive' }
  ];

  groupByOptionsList = [
    { label: 'Job Position', icon: 'pi pi-briefcase', value: 'position' as const },
    { label: 'Work Type', icon: 'pi pi-desktop', value: 'workType' as const },
    { label: 'None', icon: 'pi pi-times', value: null }
  ];

  Roles = [
    { label: 'Admin', value: 'Active' },
    { label: 'Employee', value: 'Probation' },
  ];

  public employees = computed<Employee[]>(() => {
    return this._employees().map((emp: any) => {
      const activeContract = emp.contracts?.find((c: any) => c.isActive);

      return {
        id: emp.id,
        badgeId: emp.badgeId || `RH-${String(emp.id).substring(0, 3).toUpperCase()}`,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone || 'N/A',
        position: activeContract?.vacancy?.title || 'No Position',
        shift: activeContract?.workType === 'Full-Time' ? 'Regular Shift' : 'Flexible',
        workType: activeContract?.workType || 'None',
        status: emp.status,
        isOnline: emp.status === 'Active',
        role: emp.role ?? null,           // ← add
        hireDate: emp.hireDate ?? null,   // ← add
        createdAt: emp.createdAt ?? null  // ← add
      };
    });
  });

  actionItems: MenuItem[] = [
    { label: 'View Profile', icon: 'pi pi-user', command: () => console.log('View') },
    { label: 'Edit Contract', icon: 'pi pi-file-edit', command: () => console.log('Edit') },
    { separator: true },
    { label: 'Delete', icon: 'pi pi-trash', styleClass: 'text-red-500', command: () => console.log('Delete') }
  ];

  ngOnInit() {
    this.bulkActions = [
      {
        label: 'Bulk Mail',
        icon: 'pi pi-envelope',
        severity: 'secondary',
        execute: (ids) => this.onBulkMailSelected(ids)
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        severity: 'danger',
        execute: (ids) => this.onBulkDeleteSelected(ids)
      }
    ];

    this.bulkMailForm = this.fb.group({
      subject: ['', Validators.required],
      body: ['', Validators.required],
    });

    this.bulkMailFields = [
      { key: 'subject', label: 'Subject', type: 'text', required: true, colSpan: 12 },
      { key: 'body', label: 'Body', type: 'textarea', required: true, colSpan: 12, rows: 6 },
    ];
    this.initForm();
    this.onLoadEmployees();
  }

  initForm(): void {
    this.employeeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      ContactNumber: ['', Validators.maxLength(20)],
      badgeId: ['', Validators.maxLength(20)],
      department: [null],
      position: ['', Validators.maxLength(100)],
      shift: [null],
      workType: [null],
      vacancyId: [null],
      status: ['Active'],
      baseSalary: [0, Validators.required],
      wageType: [null],
      role: [null]
    });
  }

  onLoadEmployees(): void {
    this.loading.show();
    this.api.get<Employee[]>('api/Employees/GetEmployees').subscribe({
      next: (data) => {
        console.log("HELLO");
        this._employees.set(data);
        console.log(this._employees());
        this.loading.hide();
        this.loadVacancies();
      },
      error: (err) => {
        console.error('Failed to load employees:', err);
        this.loading.hide();
        this.notification.error('Failed to load employees');
      }
    });
  }
  loadVacancies() {
    this.api.get<Vacancy[]>('api/GetVacancies').subscribe({
      next: (data) => {
        this.vacancyOptions = data;
        this.updateFields();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load vacancies', err)
    });
  }

  onAddEmployee(): void {
    this.employeeForm.reset({ status: 'Active' });
    this.createDialogVisible = true;
  }
  onDeleteSelected(): void {

    if (this.selectedEmployees.length === 0) return;

    const ids = this.selectedEmployees.map(e => e.id);

    this.loading.show();

    this.api.post('api/Employees/delete-multiple', ids).subscribe({
      next: () => {
        this.notification.success(`Successfully deleted ${ids.length} employees.`);
        this.selectedEmployees = [];
        this.onLoadEmployees();
        this.loading.hide();
      },
      error: (err) => {
        this.loading.hide();
        this.notification.error("Failed to delete selected employees.");
        console.error("Delete error:", err);
      }
    });
  }

  closeDialog(): void {
    this.createDialogVisible = false;
    this.employeeForm.reset({ status: 'Active' });
  }

  onSubmitEmployee(formValue: any): void {
    console.log(formValue);
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.notification.warn('Please fill in all required fields');
      return;
    }

    console.log("------------");

    console.log(formValue);
    this.submitting = true;
    // const formValue = this.employeeForm.value;

    this.loading.show();
    this.api.post<Employee>('api/Employees/CreateEmployee', formValue).subscribe({
      next: (createdEmployee) => {
        this.loading.hide();
        this.submitting = false;
        this.notification.success('Employee created successfully');
        this.closeDialog();
        this.onLoadEmployees();
      },
      error: (err) => {
        this.submitting = false;
        console.error('Failed to create employee:', err);

        let errorMessage = 'Failed to create employee. Please try again.';
        if (err.error?.errors) {
          const firstError = Object.values(err.error.errors)[0] as string[];
          errorMessage = firstError[0] || errorMessage;
        }

        this.notification.error(errorMessage);
      }
    });
  }
  groupBy = signal<'position' | 'workType' | null>(null);

  setGroupBy(value: 'position' | 'workType' | null): void {
    this.groupBy.set(value);
  }

  groupedEmployees = computed(() => {
    const list = this.employees();
    const group = this.groupBy();
    if (!group) return list;
    return [...list].sort((a, b) => {
      const valA = a[group] ?? '';
      const valB = b[group] ?? '';
      return valA.localeCompare(valB);
    });
  });

  updateFields(): void {
    this.employeeFields = [
      { key: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'John', colSpan: 6 },
      { key: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Doe', colSpan: 6 },
      { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'john.doe@example.com', colSpan: 6 },
      { key: 'ContactNumber', label: 'Phone', type: 'text', placeholder: '+1 234 567 8900', colSpan: 6 },
      {
        key: 'vacancyId',
        label: 'Position',
        type: 'select',
        options: this.vacancyOptions,
        placeholder: 'Select Position',
        colSpan: 6,
        optionLabel: 'title',
        optionValue: 'id'
      },
      {
        key: 'baseSalary', label: 'Base Salary', type: 'number', required: true, colSpan: 6,
        numberMode: 'currency', currency: 'USD', min: 0, max: 1000000,
        errorMessages: { min: 'Salary must be positive.', max: 'Salary cannot exceed 1,000,000.' }
      },
      { key: 'workType', label: 'Work Type', type: 'select', options: this.workTypeOptions, colSpan: 6 },
      { key: 'wageType', label: 'Wage Type', type: 'select', options: this.wageTypeOptions, colSpan: 6 },
      { key: 'status', label: 'Status', type: 'select', options: this.statusOptions, colSpan: 6 },
      { key: 'role', label: 'Role', type: 'select', options: this.Roles, colSpan: 6 },
    ];
  }

  onBulkMailSelected(ids: string[]): void {
  this.pendingMailIds = ids;
  this.bulkMailForm.reset();
  this.showBulkMailDialog = true;
}

onBulkMailSaved(value: any): void {
  this.notification.success(`Email sent to ${this.pendingMailIds.length} employee(s).`);
  this.pendingMailIds = [];
}

onBulkDeleteSelected(ids: string[]): void {
  this.loading.show();
  this.api.post('api/Employees/delete-multiple', ids).subscribe({
    next: () => {
      this.loading.hide();
      this.selectedEmployees = [];
      this.notification.success(`${ids.length} employee(s) deleted successfully`);
      this.onLoadEmployees();
    },
    error: () => {
      this.loading.hide();
      this.notification.error('Failed to delete selected employees');
    }
  });
}
}