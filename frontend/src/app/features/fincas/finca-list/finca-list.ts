import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { Navbar } from '../../../shared/navbar/navbar';
import { FincaService } from '../../../core/services/finca.service';
import { Finca } from '../../../core/models/finca';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-finca-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, TableModule, IconFieldModule,
    InputIconModule, ButtonModule, InputTextModule, TagModule, Navbar
  ],
  templateUrl: './finca-list.html',
  styleUrl: './finca-list.scss'
})
export class FincaListComponent implements OnInit {
  fincas: Finca[] = [];
  loading = true;

  constructor(
    private fincaService: FincaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fincaService.getFincas().subscribe({
      next: (data) => {
        this.fincas = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando fincas:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get totalHectareas(): number {
    return this.fincas.reduce((sum, f) => sum + f.hectareas, 0);
  }

  get cultivosUnicos(): number {
    return new Set(this.fincas.map(f => f.cultivo ?? 'Sin especificar')).size;
  }

eliminarFinca(id: number) {
  if (confirm('¿Estás seguro de que deseas eliminar esta parcela?')) {
    // INDICADOR VISUAL INMEDIATO:
    // Esto activará el spinner/overlay de la p-table de PrimeNG
    this.loading = true;

    this.fincaService.deleteFinca(id).subscribe({
      next: () => {
        // Actualizamos la lista local
        this.fincas = [...this.fincas.filter(f => f.id !== id)];
        
        // Finalizamos el estado de carga
        this.loading = false;
        this.cdr.detectChanges();
        console.log('Finca eliminada con éxito [cite: 79]');
      },
      error: (err) => {
        // MUY IMPORTANTE: Desactivar el loading si hay error para no bloquear la pantalla
        this.loading = false;
        this.cdr.detectChanges();
        
        if (err.status === 403) {
          alert('No tienes permisos para eliminar esta finca [cite: 125, 127]');
        } else {
          console.error("Error al eliminar la finca:", err);
        }
      }
    });
  }
}
}