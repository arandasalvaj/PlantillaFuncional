# Modo Oscuro / Dark Mode

## Resumen

El sistema soporta **modo claro** y **modo oscuro** de forma nativa. La preferencia se persiste en `localStorage` y, si no existe, se respeta la configuración del sistema operativo del usuario (`prefers-color-scheme`).

---

## Arquitectura

```
ThemeService (signal)
    │
    ├── Persiste en localStorage (key: "urgenciav2-theme")
    ├── Lee prefers-color-scheme del SO como fallback
    └── Aplica/remueve clase "dark" en <html>
            │
            └── Tailwind CSS v4 → variantes dark: se activan
```

### Componentes involucrados

| Archivo | Rol |
|---|---|
| `core/services/theme.service.ts` | Servicio central — gestiona estado, persistencia y DOM |
| `styles.css` | CSS variables light/dark + `@custom-variant dark` |
| `header.component.ts/html` | Botón toggle (Sun/Moon) + clases `dark:` |
| `app.html` | Shell principal con `dark:bg-slate-950` |
| `footer.component.html` | Footer con `dark:bg-slate-900` |
| `dashboard.component.html` | Cards, textos, bordes con variantes `dark:` |
| `loading.component.html` | Spinner adaptado a dark |

---

## Cómo funciona

### 1. Activación con Tailwind CSS v4

En `src/styles.css` se declara:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Esto indica a Tailwind que las clases `dark:` se activen cuando `<html>` tenga la clase `dark` (estrategia **class-based**, no media query).

### 2. ThemeService

```typescript
// Inyectar en cualquier componente
readonly themeService = inject(ThemeService);

// Leer estado
themeService.isDark()   // signal<boolean>
themeService.theme()    // signal<'light' | 'dark'>

// Alternar
themeService.toggle();

// Forzar
themeService.set('dark');
```

**Flujo de inicialización:**
1. Lee `localStorage.getItem('urgenciav2-theme')`
2. Si no hay valor → lee `window.matchMedia('(prefers-color-scheme: dark)')`
3. Aplica la clase `dark` a `<html>` vía `document.documentElement.classList`

**Flujo al cambiar:**
1. `theme` signal se actualiza
2. `effect()` sincroniza: actualiza `isDark`, aplica clase al DOM, persiste en `localStorage`

### 3. CSS Variables

Las variables cambian automáticamente según el tema:

| Variable | Light | Dark |
|---|---|---|
| `--color-primary` | `#0d9488` (teal-600) | `#2dd4bf` (teal-400) |
| `--color-background` | `#f8fafc` (gray-50) | `#0f172a` (slate-900) |
| `--color-surface` | `#ffffff` | `#1e293b` (slate-800) |
| `--color-text` | `#0f172a` (slate-900) | `#f1f5f9` (slate-100) |
| `--color-text-muted` | `#64748b` (slate-500) | `#94a3b8` (slate-400) |

### 4. Convención de clases en templates

Cada clase Tailwind que dependa del tema lleva su contraparte `dark:`:

```html
<!-- Ejemplo: card -->
<div class="bg-white dark:bg-slate-800 ring-1 ring-gray-950/5 dark:ring-slate-700/50">
  <h2 class="text-gray-900 dark:text-slate-100">Título</h2>
  <p class="text-gray-500 dark:text-slate-400">Descripción</p>
</div>
```

**Patrón de colores dark:**

| Elemento | Light | Dark |
|---|---|---|
| Fondo página | `bg-gray-50` | `dark:bg-slate-950` |
| Fondo cards | `bg-white` | `dark:bg-slate-800` |
| Header/Footer bg | `bg-white` | `dark:bg-slate-900` |
| Texto principal | `text-gray-900` | `dark:text-slate-100` |
| Texto secundario | `text-gray-500` | `dark:text-slate-400` |
| Bordes | `border-gray-200` | `dark:border-slate-700` |
| Ring cards | `ring-gray-950/5` | `dark:ring-slate-700/50` |
| Icon backgrounds | `bg-{color}-50` | `dark:bg-{color}-950` |
| Icon text | `text-{color}-600` | `dark:text-{color}-400` |

---

## Agregar dark mode a nuevos componentes

1. Usar siempre la convención de la tabla anterior
2. Nunca usar colores hardcoded sin su contraparte `dark:`
3. El `body` ya aplica `background-color` y `color` desde CSS variables, así que el fondo base es automático

**Ejemplo mínimo:**
```html
<div class="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
  Contenido
</div>
```

---

## Persistencia

- **Key:** `urgenciav2-theme` (definida en `theme.service.ts`)
- **Valores:** `"light"` | `"dark"`
- **Storage:** `localStorage`
- **Fallback:** `prefers-color-scheme` media query del SO

El usuario solo necesita elegir una vez. La preferencia se mantiene entre sesiones.

---

## Toggle en el header

El botón está disponible tanto en desktop como en móvil:
- **Desktop:** botón con borde junto al perfil de usuario
- **Móvil:** botón compacto junto al hamburger menu
- **Icono:** `Sun` (cuando está en dark) / `Moon` (cuando está en light)
