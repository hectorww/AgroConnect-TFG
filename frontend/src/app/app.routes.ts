import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { Dashboard } from './features/dashboard/dashboard';
import { FincaMap } from './features/fincas/finca-map/finca-map';
import { FincaListComponent } from './features/fincas/finca-list/finca-list';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { FincaFormComponent } from './features/fincas/finca-form/finca-form';
import { authGuard } from './core/guards/auth-guard';
import { FincaMapView } from './features/fincas/finca-map-view/finca-map-view';
import { ProfileComponent } from './features/profile/profile';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'landing', redirectTo: '', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  // Rutas privadas protegidas
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'perfil', component: ProfileComponent, canActivate: [authGuard] },
  {
    path: 'fincas',
    canActivate: [authGuard],
    children: [
      { path: '', component: FincaListComponent },
      { path: 'nueva', component: FincaFormComponent },
      { path: 'editar/:id', component: FincaFormComponent },
      { path: 'mapa', component: FincaMapView }
    ]
  },

  { path: '**', redirectTo: '' }
];