import { Component, OnInit, computed, signal } from '@angular/core';
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
import { Payslip } from '../../models/Payslip';
import { LoadingService } from '../../services/loading-service/loading-service';
import { Notification } from '../../services/notification/notification';

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

  // employees: Employee[] = [];


  statusSummary: Summary[] = [];

  // statusSummary = [];

  employees = signal<Employee[]>([]);

  payslips = signal<Payslip[]>([]);
  selectedPayslips: Payslip[] = [];

  searchText = signal('');

  selectedStatus = signal('All Payslips');

  filteredPayslips = computed(() => {
    const status = this.selectedStatus();
    const allPayslips = this.payslips();
    const term = this.searchText();

    if (status === 'All Payslips') {
      return allPayslips.filter(p => p.employeeName?.includes(term) || p.grossSalary?.toString().includes(term) || p.netSalary?.toString().includes(term));
    }

    return allPayslips.filter(p => p.status === status && (p.employeeName?.includes(term) || p.grossSalary?.toString().includes(term) || p.netSalary?.toString().includes(term)));
  });

  // 3. Update your click handler
  selectStatus(label: string) {
    this.selectedStatus.set(label);
  }
  constructor(private fb: FormBuilder, private api: ApiService, private loading: LoadingService, private notification: Notification) { }

  ngOnInit() {
    // Only call loadEmployees here. It will call onLoadPayslips when it finishes.
    this.loadEmployees();

    this.generateForm = this.fb.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      employeeIds: [null, Validators.required]
    });
    // You don't need updateFields() here anymore either, loadEmployees handles it.
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
        options: this.employees(),
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

    if (payslip.status === 'Unpaid') {
      items.push({
        label: 'Mark as Paid',
        icon: 'pi pi-check-circle',
        styleClass: 'text-green-500',
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
        this.employees.set(employees);
        this.updateFields(); // Populates the dropdown

        // THE FIX: Now that we 100% have the employees, load the payslips!
        this.onLoadPayslips();
      },
      error: (err) => console.error('Failed to load employees:', err)
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

    this.api.post<Payslip[]>('api/Payslips/generatePayslip', payload)
      .subscribe({
        next: (generatedPayslips) => {
          this.showGenerateDialog = false;
          console.log('Success! Payslips generated:', generatedPayslips);
          this.onLoadPayslips();
        },
        error: (err) => {
          console.error('Failed to generate payslips:', err);
        }
      });
  }

  onLoadPayslips() {
    this.api.get<Payslip[]>('api/Payslips').subscribe({
      next: (data) => {
        console.log('API Response Data:', data);

        const mappedPayslips = data.map((slip: Payslip) => {
          const employee = this.employees().find(e => e.id === slip.employeeId);
          slip.employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';



          return {
            ...slip
          }
        });
        let paidSlipsCount = mappedPayslips.filter(slip => slip.status === "Paid").length;
        let unpaidSlipsCount = mappedPayslips.filter(slip => slip.status === "Unpaid").length;
        this.statusSummary = [
          { label: 'All Payslips', count: paidSlipsCount + unpaidSlipsCount, icon: 'pi-folder', color: '#64748b' },
          { label: 'Unpaid', count: unpaidSlipsCount, icon: 'pi-clock', color: '#f59e0b' },
          { label: 'Paid', count: paidSlipsCount, icon: 'pi-check-circle', color: '#22c55e' }
        ]
        mappedPayslips.forEach(el => {
          console.log(el.employeeName);

        });

        this.payslips.set(mappedPayslips);
      },
      error: (err) => console.error('Failed to load payslips:', err)
    });
  }


  openDetailDialog(payslip: any) {
    console.log('Viewing details for:', payslip);
  }

  onDeleteSelected(): void {
    if (this.selectedPayslips.length === 0) return;

    const ids = this.selectedPayslips.map(p => p.id);

    this.loading.show();
    this.api.post('api/Payslips/delete-multiple', ids).subscribe({
      next: () => {
        console.log(`Successfully deleted ${ids.length} payslips`);
        this.notification.success(`Sucessfullt deleted ${ids.length} payslips`);
        this.selectedPayslips = [];
        this.onLoadPayslips();
        this.loading.hide();
      },
      error: (err) => {
        this.notification.error(`Deletions failed`);
        this.loading.hide();
        console.error("Failed to delete selected payslips", err);
      }
    });
  }
}

export interface Summary {
  label: string,
  count: number,
  icon: string,
  color: string
}