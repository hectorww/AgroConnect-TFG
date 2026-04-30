import {
  Component, OnInit, OnDestroy, AfterViewInit,
  Input, Output, EventEmitter, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../shared/navbar/navbar';
import * as L from 'leaflet';
// Importar así fuerza que leaflet-draw se adjunte al L correcto
import 'leaflet-draw';

// Workaround para producción: asegurar que Draw está disponible
declare const window: any;

export interface FincaZona {
  latitud: number;
  longitud: number;
  geo_json: any;
}

@Component({
  selector: 'app-finca-map',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './finca-map.html',
  styleUrl: './finca-map.css'
})
export class FincaMap implements OnInit, AfterViewInit, OnDestroy {

  // ── Inputs (para uso embebido en finca-form) ─────────────────────────────
  /** Si es true oculta el navbar (uso embebido dentro del formulario) */
  @Input() embebido = false;

  /** Coordenadas iniciales del mapa */
  @Input() latitudInicial = 37.9922;
  @Input() longitudInicial = -1.1307;
  @Input() zoomInicial = 13;

  /** GeoJSON existente para carga en modo edición */
  @Input() geoJsonExistente: string | null = null;

  // ── Output (para uso embebido) ────────────────────────────────────────────
  @Output() zonaSeleccionada = new EventEmitter<FincaZona>();

  // ── Estado interno ────────────────────────────────────────────────────────
  tiloActivo: 'osm' | 'satelite' = 'osm';
  hayPoligono = false;
  coordsCentro: { lat: number; lng: number } | null = null;

  private map!: L.Map;
  private tileOSM!: L.TileLayer;
  private tileSatelite!: L.TileLayer;
  private drawnItems!: L.FeatureGroup;
  private drawControl: any;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.ngZone.runOutsideAngular(() => this.initMap());
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  // ── Init mapa ─────────────────────────────────────────────────────────────

  private initMap(): void {
    this.fixIconos();

    this.map = L.map('finca-map-container', {
      center: [this.latitudInicial, this.longitudInicial],
      zoom: this.zoomInicial,
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

    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    this.initDrawControls();

    if (this.geoJsonExistente) {
      this.cargarGeoJson(this.geoJsonExistente);
    }

    this.map.on('moveend', () => {
      const c = this.map.getCenter();
      this.ngZone.run(() => {
        this.coordsCentro = { lat: +c.lat.toFixed(5), lng: +c.lng.toFixed(5) };
      });
    });

    const centro = this.map.getCenter();
    this.coordsCentro = { lat: +centro.lat.toFixed(5), lng: +centro.lng.toFixed(5) };
  }

private initDrawControls(): void {
  const estiloBase = {
    color: '#4CAF50',
    fillColor: '#8BC34A',
    fillOpacity: 0.25,
    weight: 2
  };

  const opciones = {
    draw: {
      polygon: {
        allowIntersection: false,
        showArea: false,
        shapeOptions: estiloBase
      },
      rectangle: false as any,
      polyline: false as any,
      circle: false as any,
      circlemarker: false as any,
      marker: false as any
    },
    edit: {
      featureGroup: this.drawnItems,
      remove: true
    }
  };

  // Usar window.L garantiza la instancia correcta en producción minificada
  const LDraw = (window as any).L || L;

  this.drawControl = new LDraw.Control.Draw(opciones);
  this.map.addControl(this.drawControl);

  this.map.on(LDraw.Draw.Event.CREATED, (e: any) => {
    this.drawnItems.clearLayers();
    this.drawnItems.addLayer(e.layer);
    this.ngZone.run(() => {
      this.hayPoligono = true;
      this.emitirZona(e.layer);
    });
  });

  this.map.on(LDraw.Draw.Event.EDITED, (e: any) => {
    e.layers.eachLayer((layer: any) => {
      this.ngZone.run(() => this.emitirZona(layer));
    });
  });

  this.map.on(LDraw.Draw.Event.DELETED, () => {
    this.ngZone.run(() => { this.hayPoligono = false; });
  });
}

  private cargarGeoJson(geoJsonStr: string): void {
    try {
      const data = typeof geoJsonStr === 'string' ? JSON.parse(geoJsonStr) : geoJsonStr;
      const layer = L.geoJSON(data, {
        style: { color: '#4CAF50', fillColor: '#8BC34A', fillOpacity: 0.25, weight: 2 }
      });
      layer.eachLayer(l => this.drawnItems.addLayer(l));
      this.map.fitBounds(layer.getBounds(), { padding: [40, 40] });
      this.hayPoligono = true;
    } catch (e) {
      console.warn('[FincaMap] GeoJSON inválido:', e);
    }
  }

  private emitirZona(layer: any): void {
    const centro = layer.getBounds
      ? layer.getBounds().getCenter()
      : layer.getLatLng();
    this.zonaSeleccionada.emit({
      latitud: +centro.lat.toFixed(6),
      longitud: +centro.lng.toFixed(6),
      geo_json: layer.toGeoJSON()
    });
  }

  private fixIconos(): void {
    const icon = L.icon({
      iconUrl: 'assets/marker-icon.png',
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41],
      popupAnchor: [1, -34], shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = icon;
  }

  // ── Acciones públicas ──────────────────────────────────────────────────────

  cambiarTile(tipo: 'osm' | 'satelite'): void {
    if (tipo === this.tiloActivo) return;
    this.tiloActivo = tipo;
    this.ngZone.runOutsideAngular(() => {
      if (tipo === 'satelite') {
        this.map.removeLayer(this.tileOSM);
        this.tileSatelite.addTo(this.map);
      } else {
        this.map.removeLayer(this.tileSatelite);
        this.tileOSM.addTo(this.map);
      }
      this.drawnItems.bringToFront();
    });
  }

  centrarEnMiUbicacion(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.ngZone.runOutsideAngular(() => {
          this.map.setView([pos.coords.latitude, pos.coords.longitude], 15);
        });
      },
      () => alert('No se pudo obtener tu ubicación.')
    );
  }

  borrarZona(): void {
    this.ngZone.runOutsideAngular(() => this.drawnItems.clearLayers());
    this.hayPoligono = false;
    this.zonaSeleccionada.emit({
      latitud: this.latitudInicial,
      longitud: this.longitudInicial,
      geo_json: null
    });
  }
}
