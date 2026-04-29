import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  nombre          = '';
  email           = '';
  password        = '';
  confirmPassword = '';

  showPassword        = false;
  showConfirmPassword = false;
  isLoading           = false;
  showErrors          = false;
  registerSuccess     = false;
  errorMessage        = '';

  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(private router: Router, private authService: AuthService, private cdr: ChangeDetectorRef) {}

  get emailValido(): boolean {
    return this.EMAIL_REGEX.test(this.email);
  }

  get formularioValido(): boolean {
    return !!(
      this.nombre &&
      this.email &&
      this.emailValido &&
      this.password &&
      this.password.length >= 8 &&
      this.password === this.confirmPassword
    );
  }

  onSubmit(): void {
    this.showErrors   = true;
    this.errorMessage = '';

    if (!this.formularioValido) return;

    this.isLoading = true;

    this.authService.register({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.isLoading       = false;
        this.registerSuccess = true;
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err.error?.error ?? '';

        if (err.name === 'TimeoutError') {
          this.errorMessage = 'El servidor tardó demasiado en responder. Inténtalo de nuevo.';
        } else if (err.status === 409 || msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registrado')) {
          this.errorMessage = 'Este email ya está registrado.';
        } else if (err.status === 400) {
          this.errorMessage = msg || 'Datos inválidos. Revisa el formulario.';
        } else if (err.status === 0) {
          this.errorMessage = 'No se puede conectar con el servidor.';
        } else {
          this.errorMessage = 'Error al registrarse. Inténtalo de nuevo.';
        }
        this.cdr.detectChanges();
      },
    });
  }
}