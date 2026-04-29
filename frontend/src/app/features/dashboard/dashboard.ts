import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterLink } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { FincaService } from '../../core/services/finca.service';
import { Finca } from '../../core/models/finca';
import { ChartModule } from 'primeng/chart';
import { WeatherService } from '../../core/services/weather.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar, ChartModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  fincas: Finca[] = [];
  loading = true;

  // Estadísticas generales
  totalFincas = 0;
  totalHectareas = 0;
  cultivosActivos = 0;

  // Variables para TU sistema de alertas
  alertasPendientes = 0;
  alertasReales: any[] = [];

  // Datos para gráficas
  evolutionChartData: any;
  distributionChartData: any;

  chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { color: 'rgba(139,195,74,0.05)' },
        ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'Inter', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(139,195,74,0.05)' },
        ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'Inter', size: 11 } },
        beginAtZero: true
      }
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 4, hoverRadius: 6 }
    }
  };

  doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgba(255,255,255,0.7)',
          font: { family: 'Inter', size: 11 },
          usePointStyle: true,
          padding: 15
        }
      }
    }
  };

  // Inyectamos el ChangeDetectorRef (el martillo de Angular)
  constructor(
    private fincaService: FincaService,
    private weatherService: WeatherService,
    private cdr: ChangeDetectorRef 
  ) { }

  ngOnInit() {
    this.fincaService.getFincas().subscribe({
      next: (data) => {
        this.fincas = data;
        this.calculateStats();
        this.initCharts();
        
        // Ejecutamos tu Inteligencia Climática
        this.cargarAlertasClimaticas();
        
        this.loading = false;
        
        // FORZAMOS A ANGULAR A PINTAR LA PANTALLA
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error al cargar fincas de Mario:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- TU LÓGICA DE CLIMA ---
  cargarAlertasClimaticas() {
    this.alertasReales = [];
    this.alertasPendientes = 0;

    this.fincas.forEach(finca => {
      // Ajuste de seguridad: por si el backend lo manda como latitud/longitud
      let lat = (finca as any).latitud || finca.lat;
      let lon = (finca as any).longitud || finca.lon;

      // Plan B: Si Mario mandó las coordenadas dentro de geo_json
      if (!lat && finca.geo_json && finca.geo_json.length >= 2) {
         lon = finca.geo_json[0];
         lat = finca.geo_json[1];
      }

      if (lat && lon) {
        this.weatherService.getAnalisisClimatico(lat, lon).subscribe({
          next: (datosClima) => {
            if (datosClima.analisis_inteligente.nivel !== 'BAJO') {
              this.alertasReales.push({
                fincaNombre: finca.nombre,
                clima: datosClima
              });
              this.alertasPendientes = this.alertasReales.length;
              
              // FORZAMOS A ANGULAR A PINTAR LA ALERTA EN CUANTO LLEGUE
              this.cdr.detectChanges();
            }
          },
          error: (err) => {
            console.error(`Error de clima para ${finca.nombre}`, err);
          }
        });
      }
    });
  }

  // --- LÓGICA DE GRÁFICAS DE HÉCTOR ---
  calculateStats() {
    this.totalFincas = this.fincas.length;
    this.totalHectareas = this.fincas.reduce((sum, f) => sum + f.hectareas, 0);
    this.cultivosActivos = new Set(this.fincas.map(f => f.cultivo)).size;
  }

  initCharts() {
    const cultivoMap = new Map<string, number>();
    this.fincas.forEach(f => {
      cultivoMap.set(f.cultivo, (cultivoMap.get(f.cultivo) || 0) + f.hectareas);
    });

    const labels = Array.from(cultivoMap.keys());
    const values = Array.from(cultivoMap.values());

    // 🎨 MOTOR DE COLORES DINÁMICOS E INFINITOS (Ángulo Áureo)
    const backgroundColors = labels.map((_, index) => `hsl(${(index * 137.5) % 360}, 70%, 60%)`);
    const hoverColors = labels.map((_, index) => `hsl(${(index * 137.5) % 360}, 75%, 75%)`);

    this.distributionChartData = {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors,
        hoverBackgroundColor: hoverColors,
        borderColor: 'transparent',
        borderWidth: 0
      }]
    };

    const currentTotal = this.totalHectareas;
    const sixMonthsAgo = currentTotal * 0.77; 
    const growth = (currentTotal - sixMonthsAgo) / 5;

    this.evolutionChartData = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [{
        label: 'Hectáreas',
        data: [
          Math.round(sixMonthsAgo),
          Math.round(sixMonthsAgo + growth),
          Math.round(sixMonthsAgo + growth * 2),
          Math.round(sixMonthsAgo + growth * 3),
          Math.round(sixMonthsAgo + growth * 4),
          currentTotal
        ],
        borderColor: '#8BC34A',
        backgroundColor: 'rgba(139, 195, 74, 0.1)',
        fill: true,
        borderWidth: 2
      }]
    };
  }

  get recentFincas(): Finca[] {
    return this.fincas.slice(0, 5);
  }
}