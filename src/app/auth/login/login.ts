import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG компоненты
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CardModule } from 'primeng/card';
import { ApiService } from '../../services/api-service/api-service';
import { Auth } from '../../services/auth-service/auth';
import { Notification } from '../../services/notification/notification';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    FloatLabelModule,
    CardModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loading = false;

  loginForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(false)
  });

  constructor(private router: Router, private apiService: ApiService, private authService: Auth, private notification: Notification) { }

  onLogin() {
    if (this.loginForm.valid) {
      console.log(this.loginForm.value);
      this.loading = true;

      const credentials = {
        Email: this.loginForm.value.username as string,
        Password: this.loginForm.value.password as string
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log(response);
          this.loading = false;

          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          console.error('Login failed:', err);
        }
      });
    } else {
      this.notification.error('Please fill in all required fields.');
    }
  }

  onApply() {
    this.router.navigate(['/apply']);
  }
}