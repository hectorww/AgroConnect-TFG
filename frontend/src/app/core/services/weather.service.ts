import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  constructor(private http: HttpClient) {}

  // Usamos el environment igual que Héctor para apuntar a tu API
  getAnalisisClimatico(lat: number, lon: number): Observable<any> {
    let params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString());

    return this.http.get<any>(`${environment.apiUrl}/api/clima`, { params });
  }
}