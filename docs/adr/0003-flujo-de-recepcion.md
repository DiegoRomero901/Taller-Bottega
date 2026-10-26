# 0003 — Flujo de recepción y cotización

- **Estado:** aceptada
- **Fecha:** 2026-10-23

## Contexto

Había que decidir quién recibe, quién cotiza y cuándo se cobra.

## Decisión

1. El **gerente** recibe la pieza en mostrador, registra al cliente y toma fotos de entrada (`RECEIVED`).
2. El **taller** la revisa (`DIAGNOSING`). La cotización se hace después del diagnóstico, no en mostrador, para no prometer precios sin ver la pieza.
3. El **gerente** cotiza con el catálogo de servicios y fija la fecha compromiso (`QUOTED`).
4. Si el cliente acepta, se cobra un anticipo sugerido de 50% y la pieza entra a taller (`IN_WORKSHOP`). Si no, se devuelve con una nota obligatoria (`RETURNED`).
5. El **taller** marca la pieza como lista (`READY`); el cliente ya lo ve en su QR.
6. El **gerente** entrega solo cuando el saldo es cero (`DELIVERED`).

La fecha compromiso suma los días estimados de los servicios de cada pieza (las piezas se trabajan en paralelo), más un día de margen, contando lunes a sábado.

## Consecuencias

- El taller no puede cotizar ni entregar; el gerente controla precio y dinero.
- El aviso de "lista" es manual en el MVP; la notificación por WhatsApp queda para después de la apertura.
