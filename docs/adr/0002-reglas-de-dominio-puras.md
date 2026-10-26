# 0002 — Reglas de negocio puras en `server/domain`

- **Estado:** aceptada
- **Fecha:** 2026-10-23

## Contexto

Los errores caros en un taller son de estado y de dinero: entregar una pieza con saldo, saltarse la cotización o mostrar datos del cliente en la página pública.

## Decisión

Las reglas viven en funciones puras sin Prisma ni Next:

- `order-status.ts` — transiciones válidas, permisos por rol, bloqueo de entrega con saldo.
- `money.ts` — montos en centavos enteros.
- `order-identity.ts` — folio legible y token público aleatorio.
- `quote.ts` — total y fecha compromiso.
- `public-view.ts` — lo único que sale hacia la página pública, construido por lista blanca.

La Server Action `changeOrderStatus` es el único lugar que escribe `Order.status`: consulta la orden, pide permiso a `planTransition` y guarda estado e historial en una transacción, con un `updateMany` condicionado al estado anterior para evitar cambios simultáneos.

## Consecuencias

- Las reglas se prueban en milisegundos con Vitest, sin base de datos (cobertura mínima de 90% en CI).
- Cualquier nueva regla de negocio debe llegar con su prueba.
