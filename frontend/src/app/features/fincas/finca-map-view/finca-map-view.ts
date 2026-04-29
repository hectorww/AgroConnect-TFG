import { Component, AfterViewInit, OnDestroy, NgZone, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../shared/navbar/navbar';
import { FincaService } from '../../../core/services/finca.service';
import { Finca } from '../../../core/models/finca';
import * as L from 'leaflet';

@Component({
  selector: 'app-finca-map-view',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './finca-map-view.html',
  styleUrl: './finca-map-view.css'
})
export class FincaMapView implements AfterViewInit, OnDestroy {

  tiloActivo: 'osm' | 'satelite' = 'osm';
  cargando = true;
  totalFincas = 0;
  fincasSinZona = 0;
  coordsCentro: { lat: number; lng: number } | null = null;

  private map!: L.Map;
  private tileOSM!: L.TileLayer;
  private tileSatelite!: L.TileLayer;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private fincaService: FincaService
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.ngZone.runOutsideAngular(() => this.initMap());
    }, 50);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.off();
      this.map.remove();
    }
  }

  private initMap(): void {
    L.Marker.prototype.options.icon = L.icon({
      iconUrl: 'assets/marker-icon.png',
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41],
      popupAnchor: [1, -34], shadowSize: [41, 41]
    });

    this.map = L.map('finca-map-view-container', {
      center: [37.9922, -1.1307],
      zoom: 8,
      zoomControl: true
    });

    this.tileOSM = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19, attribution: '© OpenStreetMap' }
    );
    this.tileSatelite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Tiles © Esri' }
    );

    this.tileOSM.addTo(this.map);

    this.map.on('moveend', () => {
      const c = this.map.getCenter();
      // Volvemos a la zona Angular para actualizar la UI
      this.ngZone.run(() => {
        this.coordsCentro = { lat: +c.lat.toFixed(5), lng: +c.lng.toFixed(5) };
        this.cdr.detectChanges();
      });
    });

    const c0 = this.map.getCenter();
    this.coordsCentro = { lat: +c0.lat.toFixed(5), lng: +c0.lng.toFixed(5) };

    this.cargarFincas();
  }

  private cargarFincas(): void {
    this.fincaService.getFincas().subscribe({
      next: (fincas) => {
        // Actualizar estado y forzar detección de cambios
        this.totalFincas   = fincas.length;
        this.fincasSinZona = fincas.filter(
          f => !f.geo_json || (f.geo_json as any[]).length === 0
        ).length;
        this.cargando = false;
        this.cdr.detectChanges(); // ← fuerza que Angular procese el *ngIf del loading

        // Pintar fincas fuera de Angular (Leaflet no necesita CD)
        this.ngZone.runOutsideAngular(() => {
          const capas: L.Layer[] = [];

          fincas.forEach(finca => {
            const raw = finca.geo_json as any;

            if (!raw || (Array.isArray(raw) && raw.length === 0)) {
              if ((finca as any).latitud && (finca as any).longitud) {
                const m = L.marker([(finca as any).latitud, (finca as any).longitud])
                  .bindPopup(this.popup(finca), { maxWidth: 220 });
                m.addTo(this.map);
                capas.push(m);
              }
              return;
            }

            try {
              let data: any;
              if (typeof raw === 'string') {
                data = JSON.parse(raw);
              } else if (Array.isArray(raw)) {
                data = raw.length === 1 && raw[0]?.type
                  ? raw[0]
                  : { type: 'FeatureCollection', features: raw };
              } else {
                data = raw;
              }

              const layer = L.geoJSON(data, {
                style: { color: '#4CAF50', fillColor: '#8BC34A', fillOpacity: 0.22, weight: 2 }
              }).bindPopup(this.popup(finca), { maxWidth: 220 });

              layer.addTo(this.map);
              capas.push(layer);
            } catch (e) {
              console.warn(`[FincaMapView] GeoJSON inválido en "${finca.nombre}":`, e);
            }
          });

          if (capas.length > 0) {
            try {
              const bounds = L.featureGroup(capas).getBounds();
              if (bounds.isValid()) {
                this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
              }
            } catch (_) {}
          }
        });
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private popup(finca: Finca): string {
    const sinZona = !finca.geo_json || (finca.geo_json as any[]).length === 0;
    return `
      <div style="font-family:Inter,system-ui,sans-serif;padding:2px 0">
        <div style="font-weight:700;color:#2E7D32;font-size:0.88rem;margin-bottom:4px">
          ${finca.nombre}
        </div>
        <div style="font-size:0.77rem;color:#555;line-height:1.7">
          🌾 ${finca.cultivo ?? 'Sin cultivo'}<br>
          📐 ${finca.hectareas} ha
          ${sinZona ? '<br><span style="color:#ef5350;font-size:0.71rem">⚠ Sin zona dibujada</span>' : ''}
        </div>
      </div>
    `;
  }

  cambiarTile(tipo: 'osm' | 'satelite'): void {
    if (tipo === this.tiloActivo || !this.map) return;
    this.tiloActivo = tipo;
    this.ngZone.runOutsideAngular(() => {
      if (tipo === 'satelite') {
        this.map.removeLayer(this.tileOSM);
        this.tileSatelite.addTo(this.map);
      } else {
        this.map.removeLayer(this.tileSatelite);
        this.tileOSM.addTo(this.map);
      }
    });
  }

  centrarEnMiUbicacion(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.ngZone.runOutsideAngular(() => {
          this.map.setView([pos.coords.latitude, pos.coords.longitude], 14);
        });
      },
      () => alert('No se pudo obtener tu ubicación.')
    );
  }
}