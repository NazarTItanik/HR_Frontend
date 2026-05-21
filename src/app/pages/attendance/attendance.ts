import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Attendance } from '../../models/Attendance';
import { TableModule } from 'primeng/table';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms'; // Добавили для форм
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { ApiService } from '../../services/api-service/api-service';
import { DynamicFormDialogComponent, DialogFieldConfig } from '../../common/dynamic-form-dialog/dynamic-form-dialog';
import { Notification } from '../../services/notification/notification';
import { LoadingService } from '../../services/loading-service/loading-service';
import { Employee } from '../../models/Employee';
import { BulkPopoverComponent } from '../../common/bulk-toolbar-component/bulk-toolbar-component';
import { BulkAction } from '../../models/BulkAction';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { Popover } from 'primeng/popover';

@Component({
  selector: 'app-attendances',
  standalone: true,
  providers: [DatePipe],
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    TabsModule,
    TableModule,
    DynamicFormDialogComponent,
    AvatarModule,
    FormsModule,
    TagModule,
    BulkPopoverComponent,
    MenuModule,
    Popover
  ],
  templateUrl: './attendance.html', // Проверь: файл должен называться 'attendance.html', а не 'attendances.html'
  styleUrl: './attendance.css'
})

export class AttendancesComponent implements OnInit {


  activeTabValue: string = 'pending';


  //table arrays
  pendingAttendances = signal<Attendance[]>([]);
  validatedAttendances = signal<Attendance[]>([]);
  rejectedAttendances = signal<Attendance[]>([]);
  selectedAttendances: any[] = [];

  isCreateModalVisible: boolean = false;
  createForm!: FormGroup;
  formFields: DialogFieldConfig[] = [];
  employeesList: Employee[] = [];

  searchText = signal<string>('');
  isEditMode: boolean = false;
  editingAttendanceId = "";

  bulkActions: BulkAction[] = [];


  filteredPending = computed<Attendance[]>(() => this.filterAttendance(this.pendingAttendances(), this.searchText()));
  filteredValidated = computed<Attendance[]>(() => this.filterAttendance(this.validatedAttendances(), this.searchText()));
  filteredRejected = computed(() => this.filterAttendance(this.rejectedAttendances(), this.searchText()));

  private filterAttendance(attendances: Attendance[], term: string) {
    const search = term.toLowerCase().trim();
    const all = attendances;
    if (!search) return all;

    return all.filter(a => {
      const name = `${a.employee?.firstName || ''} ${a.employee?.lastName || ''}`.toLowerCase();
      const email = (a.employee?.email || '').toLowerCase();
      return name.includes(search) || email.includes(search);
    });


  }


  constructor(private api: ApiService, private fb: FormBuilder, private notification: Notification, private loading: LoadingService, private datePipe: DatePipe) { }

  ngOnInit() {
    this.updateBulkActions("pending");
    this.loadAttendances();
    this.loadEmployees();
    this.initForm();
  }

  updateBulkActions(status: string): void {
    const approve: BulkAction = {
      label: 'Approve',
      icon: 'pi pi-check',
      severity: 'success',
      execute: (ids: string[]) => this.onBulkApprove(ids)
    };
    const reject: BulkAction = {
      label: 'Reject',
      icon: 'pi pi-times',
      severity: 'warn',
      execute: (ids: string[]) => this.onBulkReject(ids)
    };
    const remove: BulkAction = {
      label: 'Delete',
      icon: 'pi pi-trash',
      severity: 'danger',
      execute: (ids: string[]) => this.onBulkDelete(ids)
    };

    if (status === 'pending') {
      this.bulkActions = [approve, reject, remove];
    } else if (status === 'validated') {
      this.bulkActions = [reject, remove];
    } else if (status === 'rejected') {
      this.bulkActions = [approve, remove];
    }
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
  initForm() {
    this.createForm = this.fb.group({
      employeeId: [null, Validators.required],
      date: [null, Validators.required],
      // Валидация регулярным выражением, чтобы вводили строго время (например, 09:00 или 18:30)
      clockIn: ['', [Validators.required, Validators.pattern('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      clockOut: ['', [Validators.required, Validators.pattern('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')]]
    });

    this.updateFormFields();
  }

  // 3. Конфигурация полей для DynamicFormDialogComponent
  updateFormFields() {
    this.formFields = [
      {
        key: 'employeeId',
        label: 'Employee',
        type: 'select',
        required: true,
        options: this.employeesList,
        placeholder: 'Select Employee...',
        colSpan: 12,
        optionLabel: "fullName",
        optionValue: "id",
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        required: true,
        colSpan: 12
      },
      {
        key: 'clockIn',
        label: 'Clock In (HH:mm)',
        type: 'text',
        placeholder: '09:00',
        required: true,
        colSpan: 6,
        errorMessages: { pattern: 'Please use HH:mm format (e.g. 09:00)' }
      },
      {
        key: 'clockOut',
        label: 'Clock Out (HH:mm)',
        type: 'text',
        placeholder: '18:00',
        required: true,
        colSpan: 6,
        errorMessages: { pattern: 'Please use HH:mm format (e.g. 18:00)' }
      }
    ];
  }

  loadAttendances() {
    this.loading.show();
    this.api.get<Attendance[]>('api/Attendance/Pending').subscribe({
      next: (data) => {
        this.pendingAttendances.set(data);
        data.forEach(em => {
          console.log(em.employee?.id);
        })
        console.log(data);
        this.loading.hide();
      },
      error: (err) => {
        console.log(err.message)
      }
    });

    this.loading.show();
    this.api.get<Attendance[]>('api/Attendance/Validated').subscribe({
      next: (data) => {
        this.loading.hide();
        this.validatedAttendances.set(data);
      },
      error: (err) => {
        console.log(err.message);
      }
    });
    this.api.get<Attendance[]>('api/Attendance/Rejected').subscribe({
      next: (data) => this.rejectedAttendances.set(data),
      error: (err) => console.log(err.message)
    });

  }
  onTabChange(event: any) {
    setTimeout(() => {
      const status = event;

      this.updateBulkActions(status);

      this.activeTabValue = status;
    });
  }
  onCreate() {
    this.createForm.reset();
    this.isCreateModalVisible = true;
  }

  onEdit(attendance: Attendance) {
    this.isEditMode = true;
    this.editingAttendanceId = attendance.id;
    console.log(this.datePipe.transform(attendance.clockIn, 'HH:mm'));

    // Pre-fill the form with existing values
    this.createForm.patchValue({
      employeeId: attendance.employeeId,
      date: new Date(attendance.date),
      clockIn: this.datePipe.transform(attendance.clockIn, 'HH:mm') || '',
      clockOut: this.datePipe.transform(attendance.clockOut, 'HH:mm') || ''
    });

    this.isCreateModalVisible = true;
  }

  // Add this helper method inside your AttendancesComponent class
  formatTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);

    // Get hours and minutes, padding with '0' if they are single digits
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  // 5. Обработка успешного сохранения из динамического компонента
  onSaveAttendance(formData: any) {
    // formData.date приходит как объект Date. Нам нужно вытащить из него YYYY-MM-DD
    const dateObj = new Date(formData.date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const cleanDate = `${year}-${month}-${day}`;

    // Собираем идеальный JSON, который ждет наш C# метод Create
    const payload: AttendancePayload = {
      employeeId: formData.employeeId,
      date: `${cleanDate}T00:00:00Z`,
      clockIn: `${cleanDate}T${formData.clockIn}:00Z`, // Склеиваем дату и введенное время
      clockOut: `${cleanDate}T${formData.clockOut}:00Z`
    };

    const apiCall = this.isEditMode
      ? this.api.post('api/Attendance/update', payload)
      : this.api.post('api/Attendance', payload);

    if (this.isEditMode) {
      payload.id = this.editingAttendanceId;
    }

    console.log(this.isEditMode);
    this.loading.show();
    apiCall.subscribe({
      next: () => {
        this.loading.hide();
        this.notification.success("Attendance created successfully!");
        this.isCreateModalVisible = false;
        this.isEditMode = false;
        this.loadAttendances();
      },
      error: (err) => {
        console.log(err.message);
        this.notification.error("Failed to create attendance");
        this.loading.hide();

      }
    });
  }

  onDelete(id: string): void {
    let ids: string[] = [];
    ids.push(id);
    
    this.loading.show();
    this.api.post('api/Attendance/delete-multiple', ids).subscribe({
      next: () => {
        this.loading.hide();
        this.selectedAttendances = [];
        this.notification.success(`${ids.length} attendance(s) deleted`);
        this.loadAttendances();
      },
      error: () => {
        this.loading.hide();
        this.notification.error('Failed to delete selected attendances');
      }
    });
  }

  onValidateAttendance(ids: string): void {
    let array: string[] = [];
    array.push(ids);
    this.api.post<string>(`api/Attendance/approve-multiple`, array).subscribe({
      next: (data) => {
        this.notification.success("Successfully validated");
        this.loadAttendances();
        console.log("Okay");
      },
      error: (err) => {
        console.log(err.message)
        console.log("HUEVO")
        console.log(err.message);
        this.notification.error("Validation failed");
      }
    });

  }

  onRejectAttendance(id: string): void {
    this.api.post(`api/Attendance/reject/${id}`).subscribe({
      next: () => {
        this.notification.success('Attendance rejected');
        this.loadAttendances();
      },
      error: () => this.notification.error('Failed to reject attendance')
    });
  }

  onBulkApprove(ids: string[]): void {
    this.loading.show();
    this.api.post('api/Attendance/approve-multiple', ids).subscribe({
      next: () => {
        this.loading.hide();
        this.selectedAttendances = [];
        this.notification.success(`${ids.length} attendance(s) approved`);
        this.loadAttendances();
      },
      error: () => {
        this.loading.hide();
        this.notification.error('Failed to approve attendances');
      }
    });
  }

  onBulkReject(ids: string[]): void {
    this.loading.show();
    this.api.post('api/Attendance/reject-multiple', ids).subscribe({
      next: () => {
        this.loading.hide();
        this.selectedAttendances = [];
        this.notification.success(`${ids.length} attendance(s) rejected`);
        this.loadAttendances();
      },
      error: () => {
        this.loading.hide();
        this.notification.error('Failed to reject attendances');
      }
    });
  }

  onBulkDelete(ids: string[]): void {
    this.loading.show();
    this.api.post('api/Attendance/delete-multiple', ids).subscribe({
      next: () => {
        this.loading.hide();
        this.selectedAttendances = [];
        this.notification.success(`${ids.length} attendance(s) deleted`);
        this.loadAttendances();
      },
      error: () => {
        this.loading.hide();
        this.notification.error('Failed to delete selected attendances');
      }
    });
  }
}
interface AttendancePayload {
  id?: string; // The '?' means this property is optional
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut: string;
}