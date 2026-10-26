# CLAUDE.md — Taller Bottega

Sistema de órdenes de reparación para Bottega & Preserva, taller de restauración de bolsos y zapatos en León, Gto.
Registra cada pieza desde la recepción hasta la entrega y permite al cliente consultar su estado por QR.
La especificación completa vive en el doc "Taller Bottega — Especificación del MVP". Si algo aquí la contradice, manda la especificación.

## Stack

- Next.js 16 (App Router, Cache Components activado) + TypeScript en modo estricto. Lee `AGENTS.md`: esta versión cambia APIs; consulta `node_modules/next/dist/docs/` antes de usar una API que no conozcas
- Server Actions para mutaciones; no crear API routes salvo para webhooks o la descarga del PDF del ticket
- PostgreSQL + Prisma 7 con `@prisma/adapter-pg`. Cliente generado en `src/generated/prisma` (importa desde `@/generated/prisma/client`); URL de conexión en `prisma.config.ts`. Migraciones en `prisma/migrations`, nunca `db push` en producción
- Auth.js v5 con email y contraseña; roles: `ADMIN`, `MANAGER`, `WORKSHOP`. Configuración edge-safe en `src/auth.config.ts`, proveedor con Prisma en `src/auth.ts`, protección de rutas en `src/proxy.ts` (en Next 16 `middleware` se llama `proxy`)
- Tailwind + shadcn/ui
- Zod para validar toda entrada de formularios y Server Actions
- Cloudflare R2 (API S3) para fotos, con URLs firmadas
- Vitest (unitarias) y Playwright (e2e)
- Despliegue en Vercel; CI en GitHub Actions

## Comandos

```bash
docker compose up -d        # PostgreSQL local
pnpm install
pnpm db:migrate             # prisma migrate dev
pnpm db:seed                # datos demo (sin datos reales de clientes)
pnpm dev
pnpm lint && pnpm typecheck
pnpm test                   # Vitest
pnpm test:e2e               # Playwright
```

## Estructura

```
src/
  app/
    (internal)/        # panel, recepción, órdenes, taller — requiere sesión
    o/[token]/         # página pública de seguimiento — sin sesión
  server/
    actions/           # Server Actions, una carpeta por módulo
    domain/            # reglas de negocio puras (estados, montos), sin Prisma
    db.ts              # cliente Prisma
  components/
  lib/
prisma/
tests/
  unit/
  e2e/
  generated/prisma/    # cliente Prisma generado (no se versiona)
  proxy.ts
docs/adr/              # decisiones técnicas
```

## Reglas de dominio

- Estados de orden: `RECEIVED → DIAGNOSING → QUOTED → IN_WORKSHOP → READY → DELIVERED`, y `QUOTED → RETURNED` si el cliente no aprueba.
- Toda transición se valida con `planTransition` (`server/domain/order-status.ts`), que devuelve el `StatusEvent` a guardar. La única escritura de `Order.status` es la Server Action `server/actions/orders/change-status.ts`, en una transacción.
- El taller no cotiza ni entrega; no se entrega con saldo pendiente; devolver sin servicio exige nota.
- Montos en centavos (`Int`). Nunca usar `Float` para dinero.
- Folio legible por humanos (`BP-000123`); token público aleatorio de 32 caracteres, distinto del folio.
- La página pública muestra solo: folio, piezas (tipo y marca), estado, fecha compromiso y saldo. Nunca nombre, teléfono ni email.
- Fotos: comprimir en el cliente a menos de 500 KB antes de subir; etapa `INTAKE`, `PROGRESS` o `OUTPUT`.

## Convenciones

- Código, nombres de variables y commits en inglés; textos de interfaz en español de México.
- Commits con Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
- Una rama por cambio y PR a `main`; el CI debe pasar antes de fusionar.
- Toda regla nueva en `server/domain` llega con su prueba unitaria.
- Cada flujo principal (recepción, cambio de estado, consulta pública) tiene una prueba e2e.
- Decisiones técnicas relevantes se registran como ADR en `docs/adr/NNNN-titulo.md`.

## Next 16: trampas conocidas

- Con Cache Components, cualquier acceso a `params`, `searchParams`, `cookies()`, `auth()` o la base de datos va dentro de un `<Suspense>`; los datos en vivo llaman `await connection()` antes de usar `new Date()`.
- No uses `export const dynamic`: es incompatible con Cache Components.
- `PageProps` y `LayoutProps` son tipos globales que genera Next; por eso `pnpm typecheck` corre `next typegen` antes de `tsc`.
- `notFound()` dentro de un componente en streaming responde 200 con la página de no encontrado; las pruebas e2e revisan el contenido, no el código HTTP.

## Al trabajar en este repo

- Antes de implementar un módulo, lee su sección en la especificación y propone el plan.
- Corre `pnpm lint && pnpm typecheck && pnpm test` antes de dar una tarea por terminada.
- No agregues dependencias sin explicar por qué en el PR.
- No subas secretos: todo va en `.env.local`; mantén `.env.example` actualizado.
- El repo es público: los datos de seed son ficticios.
