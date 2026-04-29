import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email    = '';
  password = '';

  showPassword = false;
  isLoading    = false;
  loginError   = false;
  loginErrorMessage = '';
  showErrors   = false;

  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  get emailValido(): boolean {
    return this.EMAIL_REGEX.test(this.email);
  }

  onSubmit(): void {
    this.showErrors = true;
    this.loginError = false;
    this.loginErrorMessage = '';

    if (!this.email || !this.emailValido || !this.password) return;

    this.isLoading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.loginError = true;
        if (err.name === 'TimeoutError') {
          this.loginErrorMessage = 'El servidor tardó demasiado en responder. Inténtalo de nuevo.';
        } else if (err.status === 401 || err.status === 403) {
          this.loginErrorMessage = 'Credenciales incorrectas. Inténtalo de nuevo.';
        } else if (err.status === 0) {
          this.loginErrorMessage = 'No se puede conectar con el servidor.';
        } else {
          this.loginErrorMessage = 'No se pudo iniciar sesión. Inténtalo de nuevo.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  loginDemo(): void {
    this.email    = 'test@test.com';
    this.password = 'Test1234!';
    this.onSubmit();
  }
}