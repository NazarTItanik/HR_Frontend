import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from '../api-service/api-service';
import { Employee } from '../../models/Employee';

interface LoginResponse {
  token: string;
  user: Employee;
}

@Injectable({ providedIn: 'root' })
export class Auth {

  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'authToken';
  private readonly USER_KEY = 'authUser';      // ← новый ключ

  private readonly _token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  readonly currentUser = signal<Employee | null>(this.getStoredUser());  // ← читаем из storage

  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  login(credentials: { Email: string; Password: string }): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('api/Access/login', credentials).pipe(
      tap(response => {
        this.setToken(response.token);
        this.setUser(response.user);            // ← сохраняем юзера
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this._token();
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this._token.set(token);
  }

  private setUser(user: Employee): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private getStoredUser(): Employee | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Employee;
    } catch {
      return null;
    }
  }
}