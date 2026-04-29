import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Navbar } from '../../shared/navbar/navbar';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, Navbar],
  providers: [MessageService],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent {
  currentEmail = '';

  emailForm = {
    newEmail: '',
    password: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showEmailErrors = false;
  showPasswordErrors = false;
  savingEmail = false;
  savingPassword = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.currentEmail = this.authService.getEmailFromToken();
  }

  get emailFormValid(): boolean {
    return !!(
      this.emailForm.newEmail.trim() &&
      this.emailForm.password &&
      this.emailForm.newEmail.includes('@')
    );
  }

  get passwordFormValid(): boolean {
    return !!(
      this.passwordForm.currentPassword &&
      this.passwordForm.newPassword &&
      this.passwordForm.newPassword.length >= 6 &&
      this.passwordForm.confirmPassword &&
      this.passwordForm.newPassword === this.passwordForm.confirmPassword
    );
  }

  onSubmitEmail(): void {
    this.showEmailErrors = true;
    if (!this.emailFormValid) return;

    this.savingEmail = true;
    this.authService
      .changeEmail({
        new_email: this.emailForm.newEmail.trim(),
        password: this.emailForm.password
      })
      .subscribe({
        next: () => {
          this.savingEmail = false;
          this.currentEmail = this.emailForm.newEmail.trim();
          this.emailForm.newEmail = '';
          this.emailForm.password = '';
          this.showEmailErrors = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Correo actualizado',
            detail: 'Tu email se ha actualizado correctamente'
          });
        },
        error: (err) => {
          this.savingEmail = false;
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo actualizar el correo',
            detail: err?.error?.error ?? 'Revisa la contraseña e inténtalo de nuevo'
          });
        }
      });
  }

  onSubmitPassword(): void {
    this.showPasswordErrors = true;
    if (!this.passwordFormValid) return;

    this.savingPassword = true;
    this.authService
      .changePassword({
        current_password: this.passwordForm.currentPassword,
        new_password: this.passwordForm.newPassword
      })
      .subscribe({
        next: () => {
          this.savingPassword = false;
          this.passwordForm.currentPassword = '';
          this.passwordForm.newPassword = '';
          this.passwordForm.confirmPassword = '';
          this.showPasswordErrors = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Contraseña actualizada',
            detail: 'Tu contraseña se ha cambiado correctamente'
          });
        },
        error: (err) => {
          this.savingPassword = false;
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo cambiar la contraseña',
            detail: err?.error?.error ?? 'Verifica la contraseña actual'
          });
        }
      });
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}
