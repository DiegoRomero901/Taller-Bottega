# 0001 — Monolito Next.js en lugar de frontend y API separados

- **Estado:** aceptada
- **Fecha:** 2026-10-23

## Contexto

El sistema lo opera un solo taller con tres roles y lo mantiene un desarrollador. Debe estar en producción antes de la apertura de diciembre de 2026.

## Decisión

Una sola aplicación Next.js (App Router) con Server Actions para las mutaciones. No hay API REST separada; la única ruta de API es la de Auth.js.

## Consecuencias

- Un repo, un despliegue y tipos compartidos de punta a punta.
- Si más adelante una app móvil o WhatsApp necesitan leer órdenes, se agrega una API acotada sobre la misma capa `server/`.
