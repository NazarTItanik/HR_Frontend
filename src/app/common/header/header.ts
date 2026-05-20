import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/auth-service/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ToolbarModule, ButtonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {

  private auth = inject(Auth);

  @Output() toggleMenu = new EventEmitter<void>();



  onMenuClick() {
    this.toggleMenu.emit();
  }

  onLogout() {
    this.auth.logout();
  }
}