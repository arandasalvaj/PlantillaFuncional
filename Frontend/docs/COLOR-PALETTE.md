# Paleta de Colores — Hospital Carlos Cisterna de Calama

Referencia de colores corporativos y combinaciones recomendadas para mantener consistencia visual en todos los proyectos. Incluye variantes para **modo claro** y **modo oscuro**.

---

## Color Primario: Teal

El teal es el color principal de la marca. Se usa en elementos de identidad, navegación activa, botones primarios y acentos.

| Nombre             | Clase Tailwind    | HEX       | Uso principal                        |
|--------------------|-------------------|-----------|--------------------------------------|
| Teal 50            | `teal-50`         | `#f0fdfa` | Fondos hover, cards suaves           |
| Teal 100           | `teal-100`        | `#ccfbf1` | Badges, fondos destacados            |
| Teal 200           | `teal-200`        | `#99f6e4` | Bordes suaves, indicadores           |
| Teal 300           | `teal-300`        | `#5eead4` | Iconos secundarios                   |
| **Teal 400**       | `teal-400`        | `#2dd4bf` | Gradientes (desde), avatares         |
| **Teal 500**       | `teal-500`        | `#14b8a6` | Borde header, gradientes, botones    |
| **Teal 600**       | `teal-600`        | `#0d9488` | Texto acento, links, badges activos  |
| **Teal 700**       | `teal-700`        | `#0f766e` | Nav activo, gradientes (hasta)       |
| **Teal 800**       | `teal-800`        | `#115e59` | Texto roles, títulos gradient        |
| Teal 900           | `teal-900`        | `#134e4a` | Texto sobre fondos claros, hover nav |

### Gradientes corporativos

```html
<!-- Logo / Icono principal -->
bg-linear-to-br from-teal-500 to-teal-700 dark:from-teal-400 dark:to-teal-600

<!-- Título con texto gradiente -->
bg-linear-to-r from-teal-600 to-teal-800 dark:from-teal-300 dark:to-teal-500 bg-clip-text text-transparent

<!-- Avatar usuario -->
bg-linear-to-br from-teal-400 to-teal-600
```

---

## Neutros: Gray (modo claro)

Escala de grises para textos, fondos, bordes y elementos secundarios en **modo claro**.

| Nombre     | Clase Tailwind | HEX       | Uso principal                        |
|------------|----------------|-----------|--------------------------------------|
| Gray 50    | `gray-50`      | `#f9fafb` | Fondo general, secciones alternas    |
| Gray 100   | `gray-100`     | `#f3f4f6` | Cards, separadores suaves            |
| Gray 200   | `gray-200`     | `#e5e7eb` | Bordes, líneas divisoras             |
| Gray 300   | `gray-300`     | `#d1d5db` | Bordes de botones outline            |
| Gray 400   | `gray-400`     | `#9ca3af` | Texto placeholder, iconos inactivos  |
| Gray 500   | `gray-500`     | `#6b7280` | Texto secundario, subtítulos         |
| Gray 600   | `gray-600`     | `#4b5563` | Texto menú, profesiones              |
| Gray 700   | `gray-700`     | `#374151` | Texto cuerpo, botones outline        |
| Gray 800   | `gray-800`     | `#1f2937` | Títulos, fondos oscuros              |
| Gray 900   | `gray-900`     | `#111827` | Nombres, textos principales          |

---

## Neutros: Slate (modo oscuro)

Escala de slate usada como base en **modo oscuro**. Se aplica con variantes `dark:`.

| Nombre       | Clase Tailwind | HEX       | Uso en dark mode                     |
|--------------|----------------|-----------|--------------------------------------|
| Slate 100    | `slate-100`    | `#f1f5f9` | Texto principal (`dark:text-`)       |
| Slate 300    | `slate-300`    | `#cbd5e1` | Texto nav, enlaces                   |
| Slate 400    | `slate-400`    | `#94a3b8` | Texto secundario, subtítulos, muted  |
| Slate 500    | `slate-500`    | `#64748b` | Texto terciario, separadores, muted  |
| Slate 600    | `slate-600`    | `#475569` | Bordes botones outline               |
| Slate 700    | `slate-700`    | `#334155` | Bordes cards, divisores, dashed      |
| **Slate 800**| `slate-800`    | `#1e293b` | Fondo cards, surface                 |
| **Slate 900**| `slate-900`    | `#0f172a` | Fondo header/footer                  |
| **Slate 950**| `slate-950`    | `#020617` | Fondo general (body/shell)           |

---

## Colores Semánticos

Para estados, alertas y feedback del sistema.

### Éxito — Emerald

| Clase Tailwind  | HEX       | Uso                                  |
|-----------------|-----------|--------------------------------------|
| `emerald-100`   | `#d1fae5` | Fondos de alerta éxito               |
| `emerald-500`   | `#10b981` | Iconos éxito                         |
| `emerald-600`   | `#059669` | Toast éxito, badge producción, texto |

### Error / Peligro — Red

| Clase Tailwind | HEX       | Uso                                 |
|----------------|-----------|-------------------------------------|
| `red-50`       | `#fef2f2` | Fondo hover logout, alertas suaves  |
| `red-100`      | `#fee2e2` | Badge error, fondos alerta          |
| `red-400`      | `#f87171` | Bordes hover peligro                |
| `red-500`      | `#ef4444` | Iconos error, gradientes alerta     |
| `red-600`      | `#dc2626` | Toast error, botones danger         |
| `red-700`      | `#b91c1c` | Hover botones danger, texto logout  |

### Advertencia — Amber

| Clase Tailwind | HEX       | Uso                                 |
|----------------|-----------|-------------------------------------|
| `amber-100`    | `#fef3c7` | Fondos de indicadores pendientes    |
| `amber-500`    | `#f59e0b` | Toast warning                       |
| `amber-700`    | `#b45309` | Badge DEV/Development               |

### Información — Blue

| Clase Tailwind | HEX       | Uso                                 |
|----------------|-----------|-------------------------------------|
| `blue-50`      | `#eff6ff` | Fondos hover, nav activo            |
| `blue-100`     | `#dbeafe` | Avatares, cards dashboard           |
| `blue-200`     | `#bfdbfe` | Spinners, bordes loading            |
| `blue-500`     | `#3b82f6` | Botones primarios secundarios       |
| `blue-600`     | `#2563eb` | Toast info, botones primarios, logo sidebar |
| `blue-700`     | `#1d4ed8` | Hover botones primarios             |

### Complementario — Violet

| Clase Tailwind | HEX       | Uso                                  |
|----------------|-----------|--------------------------------------|
| `violet-100`   | `#ede9fe` | Cards dashboard (clientes)           |
| `violet-600`   | `#7c3aed` | Botones secundarios                  |
| `violet-700`   | `#6d28d9` | Hover botones secundarios            |

---

## Combinaciones Recomendadas

### Botones

| Tipo         | Fondo               | Hover                | Dark Fondo          | Dark Hover           | Texto     |
|--------------|----------------------|----------------------|---------------------|----------------------|-----------|
| Primario     | `teal-600`          | `teal-700`           | `teal-600`          | `teal-500`           | `white`   |
| Secundario   | `violet-600`        | `violet-700`         | `violet-600`        | `violet-500`         | `white`   |
| Danger       | `red-600`           | `red-700`            | `red-600`           | `red-500`            | `white`   |
| Outline      | `border-gray-300`   | `bg-teal-50`         | `border-slate-600`  | `bg-slate-700`       | `gray-700` / `slate-300` |
| Ghost        | transparente        | `gray-100`           | transparente        | `slate-800`          | `gray-600` / `slate-400` |

### Cards y contenedores

```html
<!-- Card estándar -->
bg-white dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-gray-950/5 dark:ring-slate-700/50

<!-- Card hover -->
hover:shadow-md transition-shadow duration-200

<!-- Card con stat destacado -->
bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm ring-1 ring-gray-950/5 dark:ring-slate-700/50

<!-- Sección alt (zebra) -->
bg-gray-50 dark:bg-slate-950

<!-- Icon background en cards -->
bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400
bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400
bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400
bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400
```

### Textos

| Jerarquía        | Light                 | Dark                       | Ejemplo              |
|------------------|-----------------------|----------------------------|----------------------|
| Título H1        | `text-gray-900`       | `dark:text-slate-100`      | "Dashboard"          |
| Título H2        | `text-gray-900`       | `dark:text-slate-100`      | "Panel de Control"   |
| Título gradiente | `from-teal-600 to-teal-800` | `dark:from-teal-300 dark:to-teal-500` | Logo |
| Subtítulo        | `text-gray-500`       | `dark:text-slate-400`      | Descripciones        |
| Cuerpo           | `text-gray-700`       | `dark:text-slate-300`      | Contenido general    |
| Etiqueta         | `text-gray-600`       | `dark:text-slate-400`      | Profesión, servicio  |
| Acento           | `text-teal-600`       | `dark:text-teal-400`       | Links, destacados    |
| Acento fuerte    | `text-teal-800`       | `dark:text-teal-300`       | Rol usuario, nav     |
| Muted            | `text-gray-400`       | `dark:text-slate-500`      | Placeholders         |

### Estados de navegación

```html
<!-- Link normal -->
text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-900 dark:hover:text-teal-200

<!-- Link activo -->
bg-teal-700 dark:bg-teal-600 text-white shadow-md
```

### Fondos y bordes por zona

```html
<!-- Shell / body -->
bg-gray-50 dark:bg-slate-950

<!-- Header / Footer -->
bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800

<!-- Borde header (acento) -->
border-b-4 border-teal-500 dark:border-teal-400

<!-- Bordes dashed (placeholders) -->
border-gray-200 dark:border-slate-700
```

---

## CSS Variables (Design Tokens)

Definidas en `src/styles.css`. Cambian automáticamente con `.dark` en `<html>`.

| Variable               | Light (`:root`)       | Dark (`.dark`)         |
|------------------------|-----------------------|------------------------|
| `--color-primary`      | `#0d9488` (teal-600)  | `#2dd4bf` (teal-400)   |
| `--color-primary-dark` | `#0f766e` (teal-700)  | `#14b8a6` (teal-500)   |
| `--color-primary-light`| `#99f6e4` (teal-200)  | `#134e4a` (teal-900)   |
| `--color-accent`       | `#14b8a6` (teal-500)  | `#5eead4` (teal-300)   |
| `--color-background`   | `#f8fafc` (gray-50)   | `#0f172a` (slate-900)  |
| `--color-surface`      | `#ffffff`             | `#1e293b` (slate-800)  |
| `--color-text`         | `#0f172a` (slate-900) | `#f1f5f9` (slate-100)  |
| `--color-text-muted`   | `#64748b` (slate-500) | `#94a3b8` (slate-400)  |

---

## Reglas de Uso

1. **Teal** es el color de marca — úsalo para identidad, navegación y acciones principales
2. **Slate** es la escala neutra para modo oscuro — **nunca** usar `gray-*` con `dark:`
3. **Blue** se usa como secundario para dashboard, sidebar y elementos informativos
4. **Emerald** solo para estados de éxito y badges de producción
5. **Red** solo para errores, acciones destructivas y logout
6. **Amber** solo para advertencias y badge de desarrollo
7. **Violet** para acciones alternativas/secundarias y cards de categoría
8. Siempre mantener contraste suficiente (WCAG AA mínimo)
9. Gradientes solo en: logo, avatar — no abusar
10. **Toda clase de color DEBE tener su variante `dark:`** — sin excepciones
11. Fondos: `white` / `dark:slate-800` para cards, `gray-50` / `dark:slate-950` para layout
12. Ver [DARK-MODE.md](./DARK-MODE.md) para la documentación completa del sistema de temas

---

*Paleta corporativa de referencia para todos los sistemas del hospital — Abril 2026*
