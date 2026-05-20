import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api-service/api-service';
import { Employee } from '../../models/Employee';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, ButtonModule, AvatarModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  private employeeService = inject(ApiService);

  // Сигналы для хранения состояния
  employees = signal<Employee[]>([]);
  loading = signal<boolean>(true);

  totalEmployees = computed(() => this.employees().length);

  newJoiningToday = computed(() => {
    const today = new Date().toDateString();
    return this.employees().filter(e => new Date(e.hireDate).toDateString() === today).length;
  });

  newJoiningThisWeek = computed(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return this.employees().filter(e => new Date(e.hireDate) >= oneWeekAgo).length;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.employeeService.get<Employee[]>("api/Employees", "").subscribe({
      next: (data) => {
        this.employees.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching employees', err);
        this.loading.set(false);
      }
    });
  }
}