import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';

import { ApiService } from '../../../services/api-service/api-service';
import { LoadingService } from '../../../services/loading-service/loading-service';
import { Notification } from '../../../services/notification/notification';
import { Employee, EmploymentContract } from '../../../models/Employee';
import { DialogFieldConfig, DynamicFormDialogComponent } from '../../../common/dynamic-form-dialog/dynamic-form-dialog';
import { Vacancy } from '../../../models/Vacancy';

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    AvatarModule,
    TabsModule,
    TooltipModule,
    TableModule,
    DynamicFormDialogComponent
  ],
  templateUrl: './employee-details.html',
  styleUrl: './employee-details.css'
})
export class EmployeeDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private loading = inject(LoadingService);
  private notification = inject(Notification);

  employee = signal<Employee | null>(null);
  activeTabValue: string = 'about';

  isContractModalVisible = false;
  contractForm!: FormGroup;
  contractFields: DialogFieldConfig[] = [];

  isEditModalVisible = false;
  editForm!: FormGroup;
  editFields: DialogFieldConfig[] = [];

  vacancyOptions: Vacancy[] = [];

  Roles = [
    { label: 'Admin', value: 'Admin' },
    { label: 'Employee', value: 'Employee' }
  ];

  statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Probation', value: 'Probation' },
    { label: 'Terminated', value: 'Terminated' }
  ];

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

  constructor(private fb: FormBuilder) {

  }

  // Computed для активного контракта (если он есть)
  activeContract = computed<EmploymentContract | null>(() => {
    const emp = this.employee();
    const a = emp?.contracts?.find((c: any) => c.isActive) ?? null;
    return emp?.contracts?.find((c: EmploymentContract) => c.isActive) ?? null;
  });

  pastContracts = computed<EmploymentContract[]>(() => {
    const emp = this.employee();

    if (!emp?.contracts) return [];

    return emp.contracts.filter(c => !c.isActive);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.loadEmployee(id);
    } else {
      this.notification.error('Employee ID not provided');
      this.router.navigate(['/employees']);
    }
    this.loadVacancies();
    this.updateFields();
  }

  loadEmployee(id: string): void {
    this.loading.show();
    this.api.get<Employee>(`api/Employees/GetEmployee/${id}`).subscribe({
      next: (data) => {
        this.employee.set(data);
        console.log(data);
        this.loading.hide();
      },
      error: (err) => {
        console.error('Failed to load employee:', err);
        this.loading.hide();
        this.notification.error('Failed to load employee details');
      }
    });
  }

  loadVacancies() {
    this.api.get<Vacancy[]>('api/GetVacancies').subscribe({
      next: (data) => {
        this.vacancyOptions = data;
        console.log(this.vacancyOptions);
        this.updateFields();
      },
      error: (err) => console.error('Failed to load vacancies', err)
    });
  }
  updateFields() {
    this.contractForm = this.fb.group({
      baseSalary: [0, Validators.required],
      vacancyId: ['', Validators.required], // Or vacancyId if using a select
      startDate: [new Date(), Validators.required],
      workType: ['Full-time', Validators.required],
      wageType: ['Monthly', Validators.required]
    });

    this.contractFields = [
      {
        key: 'vacancyId',
        label: 'Position',
        type: 'select',
        options: this.vacancyOptions, // Ensure this list is available here
        placeholder: 'Select Position',
        colSpan: 6,
        optionLabel: 'title',
        optionValue: 'id'
      },
      {
        key: 'baseSalary',
        label: 'Base Salary',
        type: 'number',
        required: true,
        colSpan: 6,
        numberMode: 'currency',
        currency: 'USD',
        min: 0,
        max: 1000000
      },
      {
        key: 'workType',
        label: 'Work Type',
        type: 'select',
        options: this.workTypeOptions,
        colSpan: 6
      },
      {
        key: 'wageType',
        label: 'Wage Type',
        type: 'select',
        options: this.wageTypeOptions,
        colSpan: 6
      },
      {
        key: 'startDate',
        label: 'Start Date',
        type: 'date',
        required: true,
        colSpan: 12
      }
    ];

    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      status: ['', Validators.required],
      role: ['', Validators.required]
    });

    this.editFields = [
      { key: 'firstName', label: 'First Name', type: 'text', required: true, colSpan: 6 },
      { key: 'lastName', label: 'Last Name', type: 'text', required: true, colSpan: 6 },
      { key: 'email', label: 'Email', type: 'email', required: true, colSpan: 12 },
      { key: 'status', label: 'Status', type: 'select', options: this.statusOptions, colSpan: 6 },
      { key: 'role', label: 'Role', type: 'select', options: this.Roles, colSpan: 6 }
    ];
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }

  onDelete(): void {
    console.log('Delete employee');
    // confirm + delete
  }

  onOpenContractDialog() {
    this.contractForm.reset();
    this.isContractModalVisible = true;
  }
  onSaveContract(formData: any) {
    const payload = {
      ...formData,
      employeeId: this.employee()?.id
    };

    this.api.post('api/Contracts', payload).subscribe({
      next: () => {
        this.notification.success("Contract created successfully");
        this.isContractModalVisible = false;
        // Reload employee data to reflect the new active contract
        this.loadEmployee(this.employee()!.id);
      },
      error: (err) => this.notification.error("Failed to create contract")
    });
  }

  onOpenEditDialog(): void {
    const emp = this.employee();
    if (emp) {
      this.editForm.patchValue({
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        status: emp.status,
        role: emp.role
      });
      this.isEditModalVisible = true;
    }
  }

  // 4. Save the update
  onSaveEdit(formData: any): void {
    const id = this.employee()?.id;
    this.loading.show();
    this.api.post<Employee>(`api/Employees/Update/${id}`, formData).subscribe({
      next: (updatedEmployee) => {
        this.notification.success("Profile updated successfully");
        this.isEditModalVisible = false;
        this.employee.set(updatedEmployee);
        this.loading.hide();
      },
      error: (err) => {
        this.notification.error("Failed to update profile");
        this.loading.hide();
      }
    });
  }


}