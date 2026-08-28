import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError, shareReplay } from 'rxjs/operators';
import type { AccessData, JwtPayload } from '@auth/models';
import { decodeJwtPayload } from '@auth/utils/jwt.util';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  // TTL para el caché de accessData (configurable desde environment)
  private readonly ACCESS_DATA_TTL_MS = environment.accessDataTtlMs || 30 * 60 * 1000;
  private readonly STORAGE_KEY = 'auth_access_data';
  private readonly STORAGE_TIMESTAMP_KEY = 'auth_access_data_ts';

  // Signals
  private readonly tokenSig = signal<string | null>(null);
  private readonly accessDataSig = signal<AccessData | null>(null);
  private readonly userIdSig = signal<number | null>(null);
  private readonly expSig = signal<number | null>(null);
  private readonly loadingSig = signal<boolean>(false);
  private readonly validatedSig = signal<boolean>(false);
  private readonly accessDataTimestampSig = signal<number | null>(null);

  // Cache del Observable de validación para evitar requests duplicados
  private accessValidationCache$: Observable<boolean> | null = null;

  // Computed properties
  readonly isLoading = computed(() => this.loadingSig());
  readonly isLoggedIn = computed(() => !!this.tokenSig() && !!this.accessDataSig());
  readonly accessData = computed(() => this.accessDataSig());
  readonly userId = computed(() => this.userIdSig());
  readonly hasTriedValidation = computed(() => this.validatedSig());

  /**
   * Inicializa el servicio leyendo el token desde cookie
   *
   * Optimización: Solo intenta leer cookie si no hay token cargado
   * Además, intenta restaurar accessData desde sessionStorage para evitar revalidación al recargar
   */
  initFromCookie(cookieName = 'auth_token'): void {
    // Si ya hay token, evitar re-lectura innecesaria
    if (this.tokenSig()) return;

    const token = this.readCookie(cookieName);
    if (!token) return;

    const payload = decodeJwtPayload<JwtPayload>(token);
    if (!payload?.sub) return;

    // Verificar expiración antes de cargar
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      this.clear();
      return;
    }

    this.tokenSig.set(token);
    this.userIdSig.set(Number(payload.sub));
    this.expSig.set(payload.exp || null);
    this.scheduleExpiryCheck();

    // Intentar restaurar accessData desde sessionStorage
    this.restoreAccessDataFromStorage();
  }

  getToken(): string | null {
    return this.tokenSig();
  }

  clear(): void {
    this.tokenSig.set(null);
    this.accessDataSig.set(null);
    this.userIdSig.set(null);
    this.expSig.set(null);
    this.validatedSig.set(false);
    this.accessDataTimestampSig.set(null);
    this.accessValidationCache$ = null; // Limpiar cache al logout

    // Limpiar también del sessionStorage
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.STORAGE_TIMESTAMP_KEY);
    } catch {}
  }

  private readCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  private scheduleExpiryCheck(): void {
    const exp = this.expSig();
    if (!exp) return;

    const ms = exp * 1000 - Date.now();
    if (ms <= 0) {
      this.clear();
      return;
    }

    setTimeout(() => this.clear(), ms);
  }

  /**
   * Asegura que hay accessData válido. Si no, intenta validación remota.
   * Retorna Observable<boolean> que emite true si hay acceso válido.
   *
   * Optimización: Usa cache compartido para evitar múltiples requests simultáneos
   * cuando varios guards se ejecutan al mismo tiempo.
   *
   * TTL: Si el caché tiene más de 5 minutos, fuerza revalidación automáticamente.
   *
   * Ahora usa el proxy del backend (apiBaseUrl) en lugar de llamar directamente
   * al servicio externo (loginApiUrl), evitando problemas de CORS.
   */
  ensureAccess$(apiBaseUrl: string, sistema: string): Observable<boolean> {
    // Verificar si el caché expiró por TTL
    if (this.accessDataSig() && this.isAccessDataExpired()) {
      // TTL expirado: limpiar datos y forzar revalidación
      this.accessDataSig.set(null);
      this.validatedSig.set(false);
      this.accessDataTimestampSig.set(null);
    }

    // Fast path: si ya hay datos validados y no expiraron, retornar inmediatamente
    if (this.accessDataSig()) {
      return of(true);
    }

    // No hay token, no hay acceso
    if (!this.tokenSig()) {
      return of(false);
    }

    // Si ya se validó pero no hay datos, es un rechazo
    if (this.validatedSig()) {
      return of(!!this.accessDataSig());
    }

    // Si hay una validación en curso, reusar ese Observable
    if (this.accessValidationCache$) {
      return this.accessValidationCache$;
    }

    // Crear y cachear el Observable de validación
    this.loadingSig.set(true);

    // Llamar al proxy del backend en lugar del servicio externo directamente
    this.accessValidationCache$ = this.http
      .post<AccessData>(`${apiBaseUrl}/auth/hasaccess`, {
        id: this.userIdSig(),
        sistema,
      })
      .pipe(
      map(data => {
        if (data?.has_access) {
          const timestamp = Date.now();
          this.accessDataSig.set(data);
          this.accessDataTimestampSig.set(timestamp);
          this.persistAccessDataToStorage(data, timestamp); // Persistir en sessionStorage con timestamp
          return true;
        }
        this.clear();
        return false;
      }),
      catchError(() => {
        this.clear();
        return of(false);
      }),
      tap(() => {
        this.loadingSig.set(false);
        this.validatedSig.set(true);
        this.accessValidationCache$ = null; // Limpiar cache después de completar
      }),
      shareReplay({ bufferSize: 1, refCount: true }) // Compartir entre múltiples suscriptores
    );

    return this.accessValidationCache$;
  }

  /**
   * Verifica si el accessData en caché expiró según el TTL configurado
   */
  private isAccessDataExpired(): boolean {
    const timestamp = this.accessDataTimestampSig();
    if (!timestamp) return true; // Sin timestamp = expirado

    const elapsed = Date.now() - timestamp;
    return elapsed > this.ACCESS_DATA_TTL_MS;
  }

  /**
   * Persiste accessData en sessionStorage para sobrevivir recargas de página
   * (se borra al cerrar la pestaña)
   *
   * Incluye timestamp para validación de TTL
   */
  private persistAccessDataToStorage(data: AccessData, timestamp: number): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      sessionStorage.setItem(this.STORAGE_TIMESTAMP_KEY, timestamp.toString());
    } catch (e) {
      // Ignorar errores de storage (ej. modo incógnito con storage deshabilitado)
    }
  }

  /**
   * Restaura accessData desde sessionStorage si existe, es válido y no expiró por TTL
   */
  private restoreAccessDataFromStorage(): void {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      const timestampStr = sessionStorage.getItem(this.STORAGE_TIMESTAMP_KEY);

      if (!stored || !timestampStr) return;

      const timestamp = parseInt(timestampStr, 10);
      const elapsed = Date.now() - timestamp;

      // Verificar TTL: si pasaron más de 30 minutos, no restaurar (forzar revalidación)
      if (elapsed > this.ACCESS_DATA_TTL_MS) {
        sessionStorage.removeItem(this.STORAGE_KEY);
        sessionStorage.removeItem(this.STORAGE_TIMESTAMP_KEY);
        return;
      }

      const data = JSON.parse(stored) as AccessData;
      if (data?.has_access) {
        this.accessDataSig.set(data);
        this.accessDataTimestampSig.set(timestamp);
        this.validatedSig.set(true);
      }
    } catch (e) {
      // Ignorar errores de parsing o storage
    }
  }
}
