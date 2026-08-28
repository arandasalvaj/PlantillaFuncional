import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { environment } from '@environments/environment';

/**
 * Estrategia de título de página personalizada.
 *
 * Lee `title: '...'` de cada ruta y construye:
 *   "[Título de la página] — urgenciav2"
 *
 * Si no hay título definido, usa solo el nombre de la app.
 *
 * Registrar en app.config.ts:
 *   { provide: TitleStrategy, useClass: AppTitleStrategy }
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly titleService = inject(Title);
  private readonly appName = environment.appName;

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.titleService.setTitle(pageTitle ? `${pageTitle} — ${this.appName}` : this.appName);
  }
}
