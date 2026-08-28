import { Routes } from '@angular/router';
import { authGuard } from '@auth/guards/auth.guard';
import { aclGuard } from '@auth/guards/acl.guard';
import { UnauthorizedPageComponent } from './shared/pages/unauthorized-page/unauthorized-page.component';
import { NotFoundPageComponent } from './shared/pages/not-found-page/not-found-page.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    title: 'Dashboard',
    canActivate: [authGuard, aclGuard],
    loadChildren: () => import('./features/dashboard/dashboard.routes'),
  },

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full' as const,
  },
  {
    path: 'errors/unauthorized',
    title: 'Sin acceso',
    component: UnauthorizedPageComponent,
  },
  {
    path: '**',
    title: 'Página no encontrada',
    component: NotFoundPageComponent,
  },
];
