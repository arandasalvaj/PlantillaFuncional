# Seguridad

Sistema interno del **Hospital Carlos Cisterna de Calama**.

## Reportar una vulnerabilidad

**No abrir un issue público.** Reportar directamente al Departamento TI del
hospital (Sebastián Huanca) por los canales internos. Incluir pasos para
reproducir y el impacto estimado.

## Qué trae de fábrica esta plantilla

- CSP estricta (helmet), rate-limit, CORS mínimo, headers de seguridad.
- JWT verificado con algoritmo fijado (HS256) y fail-fast sin secret.
- Logs con redacción automática de PII (RUT, nombres, tokens, cookies).
- Contenedor no-root, filesystem de solo lectura, sin token de ServiceAccount.
- Validación de entrada con Zod en body/params/query.
- `pnpm audit` + Trivy en cada PR (job `security`) y Dependabot semanal.

Los secretos van SIEMPRE por `secretKeyRef` en los manifests — jamás en el
repo, en texto plano ni en logs.
