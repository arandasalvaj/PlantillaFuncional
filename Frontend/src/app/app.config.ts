import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions, TitleStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTheme } from '@hospital-carlos-cisterna-calama/tokens';

import { routes } from './app.routes';
import { authInterceptor } from '@auth/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AppTitleStrategy } from './core/strategies/app-title.strategy';
import { AuthService } from '@auth/services/auth.service';
import { AUTH_COOKIE } from '@core/entorno';
import {
  provideLucideIcons,
  LucideActivity, LucideTrendingUp, LucideUsers, LucideFileText,
  LucideDollarSign, LucideLayoutDashboard, LucideUserRound, LucideMenu,
  LucideX, LucideLogOut, LucideSun, LucideMoon,
  LucideAlertTriangle, LucideInfo, LucideShieldAlert,
  LucideFileQuestion, LucideHome,
} from '@lucide/angular';

/**
 * Inicializa el AuthService antes de que la app renderice.
 * Sin esto, el header muestra "sin sesión" en el primer render
 * aunque el usuario tenga una cookie válida de ApiLogin.
 */
function initAuth(auth: AuthService): () => void {
  return () => auth.initFromCookie(AUTH_COOKIE);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideTheme({ storageKey: 'urgenciav2-theme' }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions()
    ),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      deps: [AuthService],
      multi: true,
    },
    // Íconos disponibles para <svg lucideIcon [lucideIcon]="'nombre-kebab'">.
    // Agregá acá el ícono nuevo que uses (import + en la lista) — se referencian
    // por nombre kebab-case en las plantillas (ej: 'file-text', 'log-out').
    provideLucideIcons(
      LucideActivity, LucideTrendingUp, LucideUsers, LucideFileText,
      LucideDollarSign, LucideLayoutDashboard, LucideUserRound, LucideMenu,
      LucideX, LucideLogOut, LucideSun, LucideMoon,
      LucideAlertTriangle, LucideInfo, LucideShieldAlert,
      LucideFileQuestion, LucideHome,
    ),
  ]
};
