# Convenciones del Proyecto — urgenciav2 Frontend

Guía de estilo y convenciones de código para la IA y el equipo de desarrollo. Usar como referencia al generar, modificar o revisar código.

---

## Stack Tecnológico

| Tecnología         | Versión / Detalle                       |
|--------------------|-----------------------------------------|
| Angular            | 21 (standalone, sin NgModules)          |
| Angular CLI        | 21.2.6                                  |
| Builder            | `@angular/build:application` (Vite/esbuild) |
| Tailwind CSS       | v4 (vía `@tailwindcss/postcss`)         |
| PostCSS config     | `.postcssrc.json` (NO `postcss.config.js`) |
| Estilos globales   | `src/styles.css` (NO `.scss`)           |
| Estilos componente | SCSS (inline `styles` o archivo `.scss`)|
| Iconos             | Lucide (`@lucide/angular`, registro por nombre) |
| Package manager    | pnpm (pin `packageManager` 10.33.2)     |
| TypeScript         | strict mode, ES2022 target              |

---

## Estructura de Archivos

```
src/app/
├── auth/                    # Módulo de autenticación (reutilizable entre proyectos)
│   ├── guards/              # auth.guard, acl.guard, role.guard
│   ├── interceptors/        # auth.interceptor
│   ├── services/            # auth.service, permissions.service
│   ├── models/              # Interfaces (AccessData, JwtPayload, etc.)
│   ├── utils/               # jwt.util
│   ├── roles.ts             # Constantes de roles y permisos
│   └── index.ts             # Barrel export
├── core/
│   └── services/            # Servicios singleton (api, loading, notification, theme)
├── shared/
│   ├── components/
│   │   ├── ui/              # Primitivos genéricos (button, card, loading, toast)
│   │   ├── header/          # Componentes compuestos de layout
│   │   └── footer/
│   ├── pages/               # Páginas compartidas (unauthorized-page)
│   └── index.ts             # Barrel export de shared
├── features/
│   └── [feature]/           # Cada módulo funcional
│       ├── [feature].component.ts
│       ├── [feature].component.html
│       └── [feature].routes.ts
├── layouts/
│   └── main-layout/         # Layout principal (sidebar + header + content)
├── environments/
│   ├── environment.ts       # Desarrollo
│   └── environment.prod.ts  # Producción
├── app.ts                   # Componente raíz
├── app.html                 # Template raíz
├── app.config.ts            # Providers globales
└── app.routes.ts            # Rutas principales
```

---

## Sintaxis de Templates

### Control Flow moderno (@if, @for, @switch)

Usar la sintaxis nativa de Angular 17+ — **NUNCA** directivas estructurales.

```html
<!-- ✅ CORRECTO — Built-in control flow -->
@if (isLoggedIn() && userData()) {
  <div>{{ userData()!.name }}</div>
} @else {
  <div>Cargando...</div>
}

@for (toast of toasts(); track toast.id) {
  <div>{{ toast.message }}</div>
}

@switch (status()) {
  @case ('active') { <span>Activo</span> }
  @case ('inactive') { <span>Inactivo</span> }
  @default { <span>Desconocido</span> }
}

<!-- ❌ INCORRECTO — NO usar directivas estructurales -->
<div *ngIf="isLoggedIn">...</div>
<div *ngFor="let item of items">...</div>
<div [ngSwitch]="status">...</div>
```

### Track obligatorio en @for

Siempre incluir `track` con un identificador único:

```html
@for (item of items(); track item.id) { ... }
```

### Non-null assertion en bloques @if

Dentro de un `@if` que verifica existencia, usar `!` para acceder a propiedades:

```html
@if (userData()) {
  <p>{{ userData()!.name }}</p>    <!-- ! porque ya validamos arriba -->
}
```

---

## Componentes

### Template SIEMPRE en archivo separado

```typescript
// ✅ CORRECTO
@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
})

// ❌ INCORRECTO — NO usar template inline
@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `<div>...</div>`,
})
```

### Standalone — Sin NgModules

Todos los componentes usan `standalone: true`. No existen NgModules en el proyecto.

```typescript
@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [OtroComponente],   // Importaciones directas
  templateUrl: './loading.component.html',
})
```

### Signals para estado reactivo

Usar `signal()`, `computed()`, `input()` en vez de `@Input()` decorators.

```typescript
// ✅ CORRECTO
readonly title = input<string>('');
readonly visible = signal(false);
readonly isActive = computed(() => this.count() > 0);

// ❌ INCORRECTO
@Input() title = '';
```

### Inyección con inject()

Preferir `inject()` sobre constructor injection.

```typescript
// ✅ CORRECTO
private readonly authService = inject(AuthService);

// ❌ INCORRECTO
constructor(private authService: AuthService) {}
```

### ChangeDetection OnPush

Usar `ChangeDetectionStrategy.OnPush` en componentes que lo ameriten (header, footer, páginas estáticas).

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### Visibilidad de miembros

- `protected` para propiedades usadas solo en el template
- `private` para lógica interna
- `readonly` para propiedades que no cambian

```typescript
protected readonly themeService = inject(ThemeService);
private readonly authService = inject(AuthService);
readonly year = new Date().getFullYear();
```

### output() en vez de @Output()

Consistente con `input()`, usar `output()` para eventos:

```typescript
// ✅ CORRECTO
readonly saved = output<Paciente>();
readonly closed = output<void>();

// ❌ INCORRECTO
@Output() saved = new EventEmitter<Paciente>();
```

### Nombrado del componente raíz

El componente raíz usa nombres cortos (sin sufijo `.component`):

```
app.ts       (no app.component.ts)
app.html     (no app.component.html)
```

Los demás componentes SÍ usan el sufijo `.component.ts` / `.component.html`.

---

## Rutas

### Formato de rutas por feature

Cada feature tiene su archivo `[feature].routes.ts` con **export default** y estructura de `children`:

```typescript
import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
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
```

### Carga en app.routes.ts

Usar `loadChildren` con `import()` directo (aprovechando el `default export`):

```typescript
{
  path: 'dashboard',
  loadChildren: () => import('./features/dashboard/dashboard.routes'),
}
```

### Layouts con loadComponent

```typescript
{
  path: '',
  loadComponent: () =>
    import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
  canActivate: [authGuard, aclGuard],
  children: [...]
}
```

### Páginas sin layout (errores) — import directo

```typescript
import { UnauthorizedPageComponent } from './shared/pages/unauthorized-page/...';

{
  path: 'errors/unauthorized',
  component: UnauthorizedPageComponent,
}
```

### Layout Data — Ocultar header/footer por ruta

Cualquier ruta puede ocultar header o footer usando `data.layout`:

```typescript
{
  path: 'login',
  component: LoginComponent,
  data: { layout: { hideHeader: true, hideFooter: true } }
}
```

El componente raíz (`app.ts`) lee esta data automáticamente via `NavigationEnd`.

---

## Guards

### Funcionales (no clases)

Todos los guards son `CanActivateFn` (funciones), no clases.

```typescript
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  // ...
};
```

### Factory para guards de rol

Usar `createRoleGuard()` para crear guards reutilizables:

```typescript
import { createRoleGuard } from '@auth/guards/role.guard';

export const canEditExample = createRoleGuard(['Admin', 'User']);
export const canManageConfig = createRoleGuard(['Admin']);
```

### Orden de guards en rutas

```typescript
canActivate: [authGuard, aclGuard, canEditExample]
//            1. Token    2. Sistema  3. Rol específico
```

---

## Interceptors

Funcionales (`HttpInterceptorFn`), registrados en `app.config.ts`:

```typescript
// app.config.ts
provideHttpClient(withInterceptors([authInterceptor]))
```

---

## Servicios

### Singleton con providedIn: 'root'

```typescript
@Injectable({ providedIn: 'root' })
export class LoadingService { }
```

### ApiService como base para heredar

```typescript
@Injectable({ providedIn: 'root' })
export class PacienteService extends ApiService {
  getAll() { return this.get<Paciente[]>('pacientes'); }
}
```

### Uso de ToastService (Toasts — Design System)

Los toasts vienen del DS (`@hospital-carlos-cisterna-calama/ui`). El contenedor
`<hcc-toast-container />` ya está colocado UNA vez en `app.html`; desde
cualquier componente/servicio solo se inyecta el servicio:

```typescript
import { ToastService } from '@hospital-carlos-cisterna-calama/ui';

private readonly toast = inject(ToastService);

// Métodos disponibles (devuelven el id del toast):
this.toast.success('Guardado correctamente');
this.toast.error('Error al guardar');
this.toast.error(detalle, { title: 'Error' });      // título + mensaje
this.toast.warning('Atención: campo vacío');
this.toast.info('Proceso iniciado', { duration: 0 }); // 0 = no se auto-cierra
this.toast.dismiss(id);                               // cierre programático
```

### Uso de LoadingService (Spinner global)

```typescript
private readonly loading = inject(LoadingService);

async save() {
  this.loading.start();
  try {
    await this.api.post('pacientes', data);
    this.notify.success('Guardado');
  } finally {
    this.loading.stop();  // SIEMPRE en finally
  }
}
```

### Uso de ThemeService (Dark Mode)

```typescript
protected readonly themeService = inject(ThemeService);

// Leer estado
themeService.isDark()     // signal<boolean>
themeService.theme()      // signal<'light' | 'dark'>

// Alternar
themeService.toggle();

// Forzar tema
themeService.set('dark');
themeService.set('light');
```

- Persiste en `localStorage` (key: `urgenciav2-theme`)
- Sin preferencia guardada → respeta `prefers-color-scheme` del SO
- Aplica clase `dark` en `<html>` automáticamente via `effect()`
- Ver [DARK-MODE.md](../docs/DARK-MODE.md) para documentación completa

### Limpieza de suscripciones RxJS

Usar `takeUntilDestroyed` con `DestroyRef` (no `OnDestroy` manual):

```typescript
private readonly destroyRef = inject(DestroyRef);

constructor() {
  this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(() => { ... });
}
```

---

## Imports y Path Aliases

### Aliases disponibles (tsconfig.json)

| Alias            | Ruta real                        | Uso                          |
|------------------|----------------------------------|------------------------------|
| `@auth/*`        | `app/auth/*`                     | Guards, services, models     |
| `@auth`          | `app/auth/index`                 | Barrel imports               |
| `@core/*`        | `app/core/*`                     | Servicios singleton          |
| `@shared/*`      | `app/shared/*`                   | Componentes compartidos      |
| `@features/*`    | `app/features/*`                 | Módulos funcionales          |
| `@layouts/*`     | `app/layouts/*`                  | Layouts                      |
| `@env`           | `environments/environment`       | Environment directo          |
| `@environments/*`| `environments/*`                 | Environment con path         |

### Regla de imports en componentes

Usar **rutas relativas** en el array `imports` del `@Component` (Angular Language Service no resuelve aliases estáticamente):

```typescript
// ✅ En @Component.imports → ruta relativa (componentes locales)
import { LoadingComponent } from '../../shared/components/ui/loading/loading.component';

// ✅ Componentes del Design System → import del paquete
import { ButtonComponent, CardComponent } from '@hospital-carlos-cisterna-calama/ui';

// ✅ En servicios, guards → alias permitido
import { AuthService } from '@auth/services/auth.service';
import { environment } from '@environments/environment';
```

---

## Tailwind CSS

### Versión 4 — Clases actualizadas

```html
<!-- ✅ Tailwind v4 -->
bg-linear-to-r        shrink-0        max-w-75        z-50

<!-- ❌ Deprecated (v3) -->
bg-gradient-to-r      flex-shrink-0   max-w-[300px]   z-[50]
```

### Configuración

- Global: `src/styles.css` con `@import "tailwindcss";`
- Dark mode: `@custom-variant dark (&:where(.dark, .dark *));` (class-based)
- PostCSS: `.postcssrc.json` → `{"plugins": {"@tailwindcss/postcss": {}}}`
- Componentes: SCSS inline (`inlineStyleLanguage: "scss"`)

### Dark Mode — Convención de clases

Toda clase de color en templates **DEBE** tener su contraparte `dark:`. Patrón:

```html
<!-- ✅ CORRECTO — siempre emparejar light + dark -->
<div class="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-gray-200 dark:border-slate-700">
  <p class="text-gray-500 dark:text-slate-400">Texto</p>
</div>

<!-- ❌ INCORRECTO — falta variante dark -->
<div class="bg-white text-gray-900">
  <p class="text-gray-500">Texto</p>
</div>
```

**Mapeo rápido de neutros:**

| Light           | Dark                     |
|-----------------|--------------------------|
| `bg-gray-50`    | `dark:bg-slate-950`      |
| `bg-white`      | `dark:bg-slate-800`      |
| `text-gray-900` | `dark:text-slate-100`    |
| `text-gray-500` | `dark:text-slate-400`    |
| `border-gray-200`| `dark:border-slate-700` |
| `ring-gray-950/5`| `dark:ring-slate-700/50`|

### Referencia de colores

Ver [COLOR-PALETTE.md](./COLOR-PALETTE.md) para la paleta corporativa completa.

---

## Iconos — @lucide/angular (registro por nombre)

`lucide-angular` quedó deprecado — este proyecto usa **`@lucide/angular`**
(signal-based). El patrón: registrar cada ícono UNA vez en `app.config.ts` y
usarlo por nombre kebab-case en cualquier template (estático o dinámico).

```typescript
// 1. app.config.ts — registro central (agregar acá cada ícono nuevo)
import { provideLucideIcons, LucideUsers, LucideSearch, LucideFileText } from '@lucide/angular';
providers: [ provideLucideIcons(LucideUsers, LucideSearch, LucideFileText) ]

// 2. En el componente: importar el componente dinámico
import { LucideDynamicIcon } from '@lucide/angular';
imports: [LucideDynamicIcon]

// 3. En el template: por nombre kebab-case
<svg lucideIcon [lucideIcon]="'users'" class="h-5 w-5 text-white"></svg>

// Dinámicos: trivial, es un string
<svg lucideIcon [lucideIcon]="isDark() ? 'sun' : 'moon'" class="h-5 w-5"></svg>
```

⚠️ `LucideDynamicIcon` es el componente (valor); `LucideIcon` es solo un tipo —
importarlo en `imports: []` da NG1010.

---

## Environment

Propiedades estándar que deben existir en ambos archivos:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',     // URL base para ApiService
  apiBaseUrl: 'http://localhost:3000/api',  // URL para auth/ACL
  loginApiUrl: 'http://localhost:3000',     // Redirect al login externo
  systemName: 'URGENCIA_NEW',       // Nombre EXACTO en ApiLogin (case-sensitive) para ACL backend
  appName: 'urgenciav2',            // Nombre visible
  version: '1.0.0',
  appVersion: '1.0.0',                     // Mostrado en footer
  accessDataTtlMs: 30 * 60 * 1000,        // TTL cache auth (30 min)
};
```

---

## Convenciones de Nomenclatura

| Elemento             | Convención                      | Ejemplo                          |
|----------------------|---------------------------------|----------------------------------|
| Componente           | PascalCase + `Component`        | `DashboardComponent`             |
| Selector             | kebab-case con prefijo `app-`   | `app-dashboard`                  |
| Servicio             | PascalCase + `Service`          | `LoadingService`                 |
| Guard                | camelCase (funcional)           | `authGuard`, `canEditExample`    |
| Interceptor          | camelCase (funcional)           | `authInterceptor`                |
| Archivo componente   | kebab-case `.component.ts`      | `dashboard.component.ts`         |
| Archivo template     | kebab-case `.component.html`    | `dashboard.component.html`       |
| Archivo rutas        | kebab-case `.routes.ts`         | `dashboard.routes.ts`            |
| Archivo servicio     | kebab-case `.service.ts`        | `loading.service.ts`             |
| Variable const       | camelCase                       | `dashboardRoutes`                |
| Signal               | camelCase                       | `isLoading`, `mobileOpen`        |
| Type/Interface       | PascalCase                      | `AccessData`, `Role`             |

---

## Auth Module — Reglas

El módulo `auth/` es **reutilizable entre proyectos**. Reglas estrictas:

1. **NO modificar** archivos dentro de `auth/` excepto `roles.ts`
2. `roles.ts` es el **único archivo personalizable** por proyecto
3. Definir constantes de roles y arrays de permisos por módulo:

```typescript
// auth/roles.ts — personalizar por proyecto
export const ROLES = {
  ADMIN: 'Admin',
  CONSULTOR: 'Consultor',
  USER: 'User'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Arrays de permisos por módulo (renombrar EXAMPLE al empezar; duplicar por módulo real)
export const EXAMPLE_WRITE_ROLES: Role[] = [ROLES.ADMIN, ROLES.USER];
export const EXAMPLE_READ_ONLY_ROLES: Role[] = [ROLES.CONSULTOR];
```

---

## app.config.ts — Providers estándar

Orden y providers que siempre deben estar:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),    // Permite @Input desde route params
      withViewTransitions()            // Transiciones de vista nativas
    ),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
  ]
};
```

---

## Router Imports en Templates

Cuando un componente usa `routerLink` o `routerLinkActive` en su template, importar explícitamente:

```typescript
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive],
})
```

Para `<router-outlet />` importar `RouterOutlet`.

---

## Diseño Responsivo

### Breakpoints utilizados

| Breakpoint | Tamaño   | Uso                          |
|------------|----------|------------------------------|
| (base)     | < 640px  | Móvil                        |
| `sm:`      | ≥ 640px  | Móvil grande                 |
| `lg:`      | ≥ 1024px | Desktop (menú visible)       |
| `xl:`      | ≥ 1280px | Desktop amplio               |

### Patrón de menú móvil

```typescript
// Signal para estado del menú
protected readonly mobileOpen = signal(false);

protected toggleMobile(): void { this.mobileOpen.update(v => !v); }
protected closeMobile(): void { this.mobileOpen.set(false); }
```

```html
<!-- Botón toggle (solo visible en móvil) -->
<div class="lg:hidden">
  <button (click)="toggleMobile()">...</button>
</div>

<!-- Menú colapsable -->
<div [class.max-h-0]="!mobileOpen()" [class.max-h-screen]="mobileOpen()">
  @if (mobileOpen()) { ...contenido... }
</div>
```

---

## Accesibilidad

1. **Skip-to-content** link en `app.html`:
   ```html
   <a href="#main" class="sr-only focus:not-sr-only ...">Saltar al contenido principal</a>
   ```
2. **`aria-label`** en botones sin texto visible
3. **Semántica HTML**: `<header>`, `<main>`, `<footer>`, `<nav>`, `<aside>`
4. **`type="button"`** explícito en todos los `<button>` que no son submit

---

## Crear un Nuevo Feature — Checklist

1. Crear carpeta `src/app/features/[nombre]/`
2. Crear componente principal:
   - `[nombre].component.ts` (standalone, templateUrl, OnPush si aplica)
   - `[nombre].component.html`
3. Crear archivo de rutas:
   - `[nombre].routes.ts` con patrón `children` + `export default`
4. Registrar en `app.routes.ts`:
   ```typescript
   { path: '[nombre]', loadChildren: () => import('./features/[nombre]/[nombre].routes') }
   ```
5. Si necesita guard de rol, crear en `auth/roles.ts` y aplicar en la ruta
6. Aplicar variantes `dark:` en todas las clases de color del template (ver tabla de mapeo)

---

## Reglas Generales

1. **NO tests** — `skipTests: true` en todos los schematics
2. **NO NgModules** — todo es standalone
3. **NO template inline** — siempre `templateUrl`
4. **NO SSR** — proyecto sin Server-Side Rendering
5. **NO `*ngIf` / `*ngFor`** — usar `@if` / `@for` (control flow nativo)
6. **NO `@Input()` / `@Output()`** — usar `input()` / `output()`
7. **NO `constructor injection`** — usar `inject()`
8. **NO `OnDestroy` manual** — usar `takeUntilDestroyed(destroyRef)`
9. **Signals** sobre Observables cuando sea posible para estado local
10. **OnPush** en componentes sin lógica de detección frecuente
11. **Lazy loading** para features y layouts
12. **Barrel exports** en `shared/index.ts` y `auth/index.ts`
13. **Docs en español** — comentarios, UI y mensajes en español
14. **Dark mode** — toda clase de color DEBE tener su variante `dark:` (usar `slate-*` para oscuro)
15. **ThemeService** — usar `inject(ThemeService)` para toggle/leer tema, nunca manipular DOM directo

---

*Referencia para IA y equipo — Plantilla oficial del hospital — Abril 2026*
