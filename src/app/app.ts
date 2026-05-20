import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router'; // Импортируем Router
import { CommonModule } from '@angular/common';
import { LoadingOverlayComponent } from './common/loading-overlay/loading-overlay';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoadingOverlayComponent, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  sidebarExpanded = false; // Твоя переменная для сайдбара

  // Внедряем роутер, чтобы проверять URL в шаблоне
  constructor(public router: Router) { }

  toggleSidebar() {
    this.sidebarExpanded = !this.sidebarExpanded;
  }
}