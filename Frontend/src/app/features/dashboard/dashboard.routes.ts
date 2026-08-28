import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        title: 'Dashboard',
        component: DashboardComponent,
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];

export default dashboardRoutes;
