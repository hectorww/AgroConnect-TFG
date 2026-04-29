import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Navbar } from '../../../shared/navbar/navbar';
import { FincaService } from '../../../core/services/finca.service';
import { Finca } from '../../../core/models/finca';
import { FincaMap, FincaZona } from '../finca-map/finca-map';

@Component({
  selector: 'app-finca-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    ButtonModule, InputTextModule, InputNumberModule,
    CardModule, ToastModule, Navbar,
    FincaMap
  ],
  providers: [MessageService],
  templateUrl: './finca-form.html',
  styleUrl: './finca-form.scss'
})
export class FincaFormComponent implements OnInit {

  isEditMode = false;
  fincaId: number | null = null;
  isLoading = false;
  isSaving  = false;
  showErrors = false;

  // MODIFICADO: geo_json ahora es un array
  form = {
    nombre:    '',
    hectareas: null as number | null,
    cultivo:   '',
    geo_json:  null as any | null
  };

  //cordenada Murcia
  /*
  latitudInicial  = 37.9922;
  longitudInicial = -1.1307;
*/


/* cordenada Frio
  latitudInicial  = 78.22;
  longitudInicial = 15.65;
*/

  latitudInicial  = 37.9922;
  longitudInicial = -1.1307;

  geoJsonExistente: string | null = null;

  private latitudMapa:  number | null = null;
  private longitudMapa: number | null = null;

  constructor(
    private fincaService: FincaService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.fincaId = +id;
      this.cargarFinca(this.fincaId);
    }
  }

  cargarFinca(id: number): void {
    this.isLoading = true;
    this.fincaService.getFinca(id).subscribe({
      next: (finca) => {
        this.form.nombre    = finca.nombre;
        this.form.hectareas = finca.hectareas;
        this.form.cultivo   = finca.cultivo ?? '';

        // MODIFICADO: Lógica de conversión segura para el array
        const rawGeoJson = finca.geo_json;
        if (rawGeoJson) {
          // Si viene como string, lo parseamos; si no, lo asignamos directamente
          this.form.geo_json = typeof rawGeoJson === 'string' 
            ? JSON.parse(rawGeoJson) 
            : rawGeoJson;

          // Mantenemos la versión string para el componente del mapa si lo requiere así
          this.geoJsonExistente = typeof rawGeoJson === 'string'
            ? rawGeoJson
            : JSON.stringify(rawGeoJson);
        } else {
          this.form.geo_json = null;
          this.geoJsonExistente = null;
        }

        if ((finca as any).latitud && (finca as any).longitud) {
          this.latitudInicial  = (finca as any).latitud;
          this.longitudInicial = (finca as any).longitud;
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la finca' });
        this.isLoading = false;
        this.router.navigate(['/fincas']);
      }
    });
  }

  onZonaSeleccionada(zona: FincaZona): void {
    this.latitudMapa  = zona.latitud;
    this.longitudMapa = zona.longitud;
    // MODIFICADO: Aseguramos que se guarde el array que viene del mapa
    this.form.geo_json = zona.geo_json;
  }

  get formValido(): boolean {
    return (
      this.form.nombre.trim().length > 0 &&
      this.form.nombre.trim().length <= 255 &&
      this.form.hectareas !== null &&
      this.form.hectareas > 0
    );
  }

  onSubmit(): void {
    this.showErrors = true;
    if (!this.formValido) return;

    this.isSaving = true;

    const payload: any = {
      nombre:    this.form.nombre.trim(),
      hectareas: this.form.hectareas!,
      cultivo:   this.form.cultivo.trim() || null,
      geo_json:  this.form.geo_json ?? null,
    };
    if (this.latitudMapa !== null)  payload.latitud  = this.latitudMapa;
    if (this.longitudMapa !== null) payload.longitud = this.longitudMapa;

    const operacion = this.isEditMode
      ? this.fincaService.updateFinca(this.fincaId!, payload)
      : this.fincaService.createFinca(payload);

    operacion.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.isEditMode ? 'Finca actualizada correctamente' : 'Finca creada correctamente'
        });
        setTimeout(() => this.router.navigate(['/fincas']), 1200);
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.error ?? 'No se pudo guardar la finca'
        });
        this.cdr.detectChanges();
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/fincas']);
  }
}