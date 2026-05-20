import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { DynamicFormDialogComponent, DialogFieldConfig } from '../../common/dynamic-form-dialog/dynamic-form-dialog';
import { ApiService } from '../../services/api-service/api-service';
import { Notification } from '../../services/notification/notification';
import { LoadingService } from '../../services/loading-service/loading-service';
import { Employee } from '../../models/Employee';
import { Leave } from '../../models/Leave';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, ButtonModule, TabsModule, DynamicFormDialogComponent, AvatarModule, TagModule],
  templateUrl: './leaves-component.html',
  styleUrl: "./leaves-component.css"
})

export class LeavesComponent implements OnInit {
  activeTabValue: string = 'pending';
  isCreateModalVisible: boolean = false;
  isEditMode: boolean = false;
  editingLeaveId: string | null = null;

  createForm!: FormGroup;
  formFields: DialogFieldConfig[] = [];

  employeesList: Employee[] = [];

  searchText = signal('');

  // Signals for the 3 lists
  pendingLeaves = signal<any[]>([]);
  approvedLeaves = signal<any[]>([]);
  rejectedLeaves = signal<any[]>([]);

  private filterLeaves(leaves: any[], term: string): Leave[] {
    const search = term.toLowerCase().trim();
    if (!search) return leaves;

    return leaves.filter(l => {
      const name = `${l.employee?.firstName || ''} ${l.employee?.lastName || ''}`.toLowerCase();
      const reason = (l.reason || '').toLowerCase();
      const type = (l.leaveType || '').toLowerCase();

      return name.includes(search) || reason.includes(search) || type.includes(search);
    });
  }


  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private notification: Notification,
    private loading: LoadingService
  ) { }

  ngOnInit() {
    this.loadLeaves();
    this.loadEmployees();
    this.initForm();
  }

  initForm() {
    this.createForm = this.fb.group({
      employeeId: [null, Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      leaveType: ['Vacation', Validators.required],
      reason: [null]
    });
    this.updateFormFields();
  }
  updateFormFields(): void {
    this.formFields = [
      { key: 'employeeId', label: 'Employee', type: 'select', required: true, options: this.employeesList, optionLabel: 'fullName', optionValue: 'id' },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true },
      { key: 'endDate', label: 'End Date', type: 'date', required: true },
      {
        key: 'leaveType',
        label: 'Leave Type',
        type: 'select',
        required: true,
        options: LEAVE_OPTIONS,
        optionLabel: 'label',
        optionValue: 'value'
      },
      { key: 'reason', label: 'Reason', type: 'textarea', required: false, colSpan: 12 }
    ];
  }
  // 1. Array to hold selected items
  selectedLeaves: any[] = [];

  // 2. Delete logic
  onDeleteSelected(): void {
    // 1. Safety check to ensure there's something to delete
    if (this.selectedLeaves.length === 0) return;

    // 2. Ask for confirmation

    // 3. Extract the IDs from your selected objects
    const ids = this.selectedLeaves.map(l => l.id);

    // 4. Show loading overlay
    this.loading.show();

    // 5. Send to your backend
    this.api.post('api/Leaves/delete-multiple', ids).subscribe({
      next: () => {
        // Success: Notify, refresh data, and clear selection
        this.notification.success(`Successfully deleted ${ids.length} records.`);
        this.selectedLeaves = [];
        this.loadLeaves();
        this.loading.hide();
      },
      error: (err) => {
        // Error: Notify and hide loading
        this.notification.error("Failed to delete selected records.");
        this.loading.hide();
        console.error("Delete error:", err);
      }
    });
  }

  // 3. Validation logic
  onValidate(leave: any) {
    this.api.post(`api/Leaves/validate/${leave.id}`, {}).subscribe({
      next: () => {
        this.notification.success("Leave approved!");
        this.loadLeaves(); // Refresh the list
      },
      error: () => this.notification.error("Failed to approve leave")
    });
  }
  onReject(leave: any) {
    // You already have the confirmation dialog logic, just add the API call here
    this.api.post(`api/Leaves/reject/${leave.id}`, {}).subscribe({
      next: () => {
        this.notification.success("Leave rejected successfully");
        this.loadLeaves(); // Refresh the list
      },
      error: () => this.notification.error("Failed to reject leave")
    });
  }

  filteredPending = computed(() => this.filterLeaves(this.pendingLeaves(), this.searchText()));
  filteredApproved = computed(() => this.filterLeaves(this.approvedLeaves(), this.searchText()));
  filteredRejected = computed(() => this.filterLeaves(this.rejectedLeaves(), this.searchText()));

  loadLeaves() {
    this.api.get<Leave[]>('api/Leaves/status/Pending').subscribe({
      next: (data) => {
        console.log("Success! Data received:", data);
        this.pendingLeaves.set(data);
        data.forEach(el => {
          console.log(el.reason);
        })
      },
      error: (err) => {
        console.error("The request failed with error:", err.message); // ALWAYS catch the error!
      }
    });
    this.api.get<Leave[]>('api/Leaves/status/Approved').subscribe({
      next: (data) => {
        console.log("seci:", data);

        this.approvedLeaves.set(data);
      },
      error: (err) => {
        console.error("The request failed with error:", err.message); // ALWAYS catch the error!
      }
    });
    this.api.get<Leave[]>('api/Leaves/status/Rejected').subscribe({
      next: (data) => {
        this.rejectedLeaves.set(data);
      },
      error: (err) => {
        console.error("The request failed with error:", err.message); // ALWAYS catch the error!
      }
    });
  }

  loadEmployees() {
    this.api.get<Employee[]>('api/Employees/GetEmployees').subscribe(data => {
      this.employeesList = data.map(employee => ({
        ...employee,
        fullName: `${employee.firstName} ${employee.lastName}`
      }));
      console.log(data);
      this.updateFormFields();
    });
  }

  onCreate() {
    this.isEditMode = false;
    this.editingLeaveId = null;
    this.createForm.reset();
    this.isCreateModalVisible = true;
  }

  onEdit(leave: any) {
    this.isEditMode = true;
    this.editingLeaveId = leave.id;
    this.createForm.patchValue({
      employeeId: leave.employeeId,
      startDate: new Date(leave.startDate),
      endDate: new Date(leave.endDate),
      leaveType: leave.leaveType,
      reason: leave.reason
    });
    this.isCreateModalVisible = true;
  }

  onSaveLeave(formData: any) {
    const payload = { ...formData };
    console.log(payload);
    if (this.isEditMode) payload.id = this.editingLeaveId;

    const apiCall = this.isEditMode
      ? this.api.post('api/Leaves/update', payload)
      : this.api.post('api/Leaves', payload);

    this.loading.show();
    apiCall.subscribe({
      next: () => {
        this.notification.success("Saved successfully");
        this.isCreateModalVisible = false;
        this.loadLeaves();
        this.loading.hide();
      },
      error: () => {
        this.notification.error("Failed to save");
        this.loading.hide();
      }
    });
  }
}

export const LEAVE_OPTIONS = [
  { label: 'Vacation', value: 'Vacation' },
  { label: 'Sick Leave', value: 'Sick' },
  { label: 'Unpaid Leave', value: 'Unpaid' }
];