import { Component, HostListener, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { AuthService } from '../../../auth/services/auth.service';
import { ThemeService } from '@hospital-carlos-cisterna-calama/tokens';
import { environment } from '@environments/environment';
import { AUTH_COOKIE, LOGIN_URL } from '@core/entorno';

export interface NavLink {
  label: string;
  path: string;
  iconName: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideDynamicIcon],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block shrink-0' },
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);


  /** Links de navegación — agregar nuevos aquí */
  readonly navLinks: NavLink[] = [
    { label: 'Dashboard', path: '/dashboard', iconName: 'layout-dashboard' },
  ];

  readonly mobileOpen = signal(false);
  readonly scrolled = signal(false);

  readonly userData = computed(() => {
    const access = this.authService.accessData();
    return access
      ? {
          name: access.nombre_completo || access.username || 'Usuario',
          role: access.rol || 'Sin rol',
          profession: access.profesion || '',
          service: access.servicio || '',
        }
      : null;
  });

  readonly isLoggedIn = this.authService.isLoggedIn;

  toggleMobile(): void {
    this.mobileOpen.update(v => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  logout(): void {
    // Limpiar signals y sessionStorage
    this.authService.clear();
    // Eliminar la cookie auth_token que emitió ApiLogin
    document.cookie = AUTH_COOKIE + '=; path=/; max-age=0; samesite=lax';
    // Redirigir al portal de login de ApiLogin
    window.location.href = LOGIN_URL;
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 10);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 1024) {
      this.mobileOpen.set(false);
    }
  }
}
