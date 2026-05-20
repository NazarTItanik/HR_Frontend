import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api-service/api-service';
import { Employee } from '../../models/Employee';
import { RouterLink } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, ButtonModule, AvatarModule, BadgeModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  private employeeService = inject(ApiService);

  // Сигналы для хранения состояния
  employees = signal<Employee[]>([]);

  constructor(private api: ApiService) {

  }
  // Add these signals to your component
  pendingAttendancesCount = signal<number>(0);
  unpaidPayslipsCount = signal<number>(0);

  // Example of how to grab these quickly on load
  loadActionItems(): void {
    this.api.get<any[]>('api/Attendance/Pending').subscribe(data => {
      this.pendingAttendancesCount.set(data.length);
    });

    this.api.get<any[]>('api/Payslips').subscribe(data => {
      const unpaid = data.filter(p => p.status === 'Unpaid').length;
      this.unpaidPayslipsCount.set(unpaid);
    });
  }

  totalEmployees = computed(() => this.employees().length);



  activeEmployeesList = computed(() => {
    return this.employees().filter(emp => emp.status === 'Active');
  });

  metrics = computed<DashboardMetrics>(() => {
    let all = this.employees();
    const today = new Date();

    // Helper to normalize dates (strip time)
    const isSameDay = (d1: string | Date, d2: Date) => {
      const date1 = new Date(d1);
      return date1.toDateString() === d2.toDateString();
    };

    function isDateInThisWeek(inputDate: string | Date): boolean {
      const date = new Date(inputDate);
      const today = new Date();

      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      firstDayOfWeek.setHours(0, 0, 0, 0);

      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 7);
      lastDayOfWeek.setHours(23, 59, 59, 999);

      return date >= firstDayOfWeek && date <= lastDayOfWeek;
    }

    return {
      totalEmployees: all.length,
      newJoiningToday: all.filter(e => isSameDay(e.hireDate, new Date())).length,
      newJoiningThisWeek: all.filter(e => isDateInThisWeek(e.hireDate)).length,
      pendingAttendancesCount: this.pendingAttendancesCount(),
      unpaidPayslipsCount: this.unpaidPayslipsCount()
    };

  });


  ngOnInit() {
    this.loadEmployees();
    this.loadActionItems();
  }

  loadEmployees() {
    this.api.get<Employee[]>('api/Employees/GetEmployees').subscribe({
      next: (data) => {
        this.employees.set(data); // Updating this signal triggers the computed metrics!
      }
    });
  }
}

export interface DashboardMetrics {
  newJoiningToday: number;
  newJoiningThisWeek: number;
  totalEmployees: number;
  pendingAttendancesCount: number;
  unpaidPayslipsCount: number;
}