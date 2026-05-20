import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth-service/auth';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.html'
})
export class UserDashboardComponent implements OnInit {
  private authService = inject(Auth);

  // Данные текущего пользователя
  userName: string = 'Сотрудник';
  jobTitle: string = 'Software Engineer'; // Пока заглушка, позже привяжешь к API

  // Заглушки для блоков, которые ты добавишь позже
  availableVacationDays: number = 14;
  availableSickDays: number = 5;
  nextPayday: string = '05 Июня 2026';

  upcomingInterviews = [
    { candidateName: 'Алексей Смирнов', position: 'Frontend Developer', date: 'Завтра, 14:00' },
    { candidateName: 'Мария Иванова', position: 'QA Engineer', date: 'Пятница, 11:30' }
  ];

  ngOnInit() {
    // Пытаемся достать реальное имя из сервиса
    this.userName = "DIMA";
    // if (user && user.firstName) {
    //   this.userName = user.firstName;
    // }
  }

  clockIn() {
    alert('Вы успешно отметились на работе!');
    // Здесь позже будет вызов API: this.apiService.post('api/attendance/clock-in', {})
  }
}