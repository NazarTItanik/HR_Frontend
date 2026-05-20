import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

// PrimeNG Native Imports
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar'; // Added Toolbar
import { BadgeModule } from 'primeng/badge';     // Added Badge
import { MenuModule } from 'primeng/menu';       // Added Menu
import { MenuItem } from 'primeng/api';          // Added MenuItem Interface

import { DynamicFormDialogComponent, DialogFieldConfig } from '../../common/dynamic-form-dialog/dynamic-form-dialog';
import { ApiService } from '../../services/api-service/api-service';
import { Employee } from '../../models/Employee';

@Component({
  selector: 'app-payslips',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, TableModule, InputTextModule, AvatarModule,
    TagModule, ToolbarModule, BadgeModule, MenuModule, // <-- Ensure these are here
    DynamicFormDialogComponent
  ],
  templateUrl: './payslips.html',
  styleUrl: './payslips.css',
})
export class PayslipsComponent implements OnInit {

  showGenerateDialog = false;
  generateForm!: FormGroup;
  generateFields: DialogFieldConfig[] = [];

  employees: Employee[] = [];

  statusSummary = [
    { label: 'All Payslips', count: 2, active: true, icon: 'pi-folder', color: '#64748b' },
    { label: 'Unpaid', count: 1, active: false, icon: 'pi-clock', color: '#f59e0b' },
    { label: 'Paid', count: 1, active: false, icon: 'pi-check-circle', color: '#22c55e' }
  ];

  dummyPayslips = [
    { id: 1, employeeName: 'Vladyslav D.', periodStart: '2026-05-01', periodEnd: '2026-05-15', generationDate: '2026-05-19', grossSalary: '4000.00', netSalary: '3200.00', status: 'Unpaid' },
    { id: 2, employeeName: 'Vetal S.', periodStart: '2026-04-15', periodEnd: '2026-04-30', generationDate: '2026-05-01', grossSalary: '3500.00', netSalary: '2800.00', status: 'Paid' }
  ];

  constructor(private fb: FormBuilder, private api: ApiService) { }

  ngOnInit() {
    this.loadEmployees();
    this.generateForm = this.fb.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      employeeIds: [null, Validators.required]
    });
    this.updateFields();
  }
  updateFields(): void {
    this.generateFields = [
      { key: 'startDate', label: 'Start Date', type: 'date', required: true, colSpan: 6 },
      { key: 'endDate', label: 'End Date', type: 'date', required: true, colSpan: 6 },
      {
        key: 'employeeIds',
        label: 'Employees',
        type: 'multiselect',
        required: true,
        colSpan: 12,
        placeholder: 'Select employees or leave blank for all',
        options: this.employees,
        optionLabel: 'firstName',
        optionValue: 'id',
      }
    ];
  }

  // Pure PrimeNG way to generate an action menu per row
  getMenuItems(payslip: any): MenuItem[] {
    const items: MenuItem[] = [
      {
        label: 'View Receipt',
        icon: 'pi pi-eye',
        command: () => this.openDetailDialog(payslip)
      }
    ];

    // Conditionally add "Mark as Paid" if the status is Unpaid
    if (payslip.status === 'Unpaid') {
      items.push({
        label: 'Mark as Paid',
        icon: 'pi pi-check-circle',
        styleClass: 'text-green-500', // PrimeFlex to make this item green
        command: () => console.log('Marking as paid:', payslip.id)
      });
    }

    items.push(
      { separator: true },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        styleClass: 'text-red-500', // PrimeFlex for danger action
        command: () => console.log('Deleting:', payslip.id)
      }
    );

    return items;
  }

  loadEmployees() {
    this.api.get<Employee[]>('api/Employees/GetEmployees').subscribe({
      next: (employees) => {
        this.employees = employees;
        console.log(this.employees);
        this.updateFields();
      },
      error: (err) => {
        console.error('Failed to load employees:', err);
      }
    });
  }

  openGenerateDialog() {
    this.generateForm.reset();
    this.showGenerateDialog = true;
  }

  onGenerateSubmit(value: any) {
    const payload = {
      startDate: value.startDate,
      endDate: value.endDate,
      employeeIds: value.employeeIds || [] // Send the selected IDs, or empty if none
    };
    console.log(payload);

    // Replace '/api/payslips/generatePayslip' with your actual endpoint URL
    this.api.post<any[]>('api/Payslips/generatePayslip', payload)
      .subscribe({
        next: (generatedPayslips) => {
          console.log("generated payslip: ", generatedPayslips);
          // Update your table with the new data
          // We use spread syntax to keep existing data and add the new items
          this.dummyPayslips = [...generatedPayslips, ...this.dummyPayslips];

          this.showGenerateDialog = false;
          console.log('Success! Payslips generated:', generatedPayslips);
        },
        error: (err) => {
          console.error('Failed to generate payslips:', err);
          // Optionally: this.submitError = 'Failed to generate, please check dates.';
        }
      });
  }

  openDetailDialog(payslip: any) {
    console.log('Viewing details for:', payslip);
  }
}