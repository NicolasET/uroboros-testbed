# Private record — order-lifecycle

## IDEA

Quiero que los compradores puedan cancelar un pedido abierto, que el vendedor de la publicación pueda marcarlo como entregado, y que el comprador, el vendedor y los administradores puedan ver el detalle de un pedido. Agrégalo a la API como `POST /orders/:id/cancel`, `POST /orders/:id/fulfill` y `GET /orders/:id`.

## IDEA ITEMS

- I1: "que los compradores puedan cancelar un pedido abierto"
- I2: "que el vendedor de la publicación pueda marcarlo como entregado"
- I3: "que el comprador, el vendedor y los administradores puedan ver el detalle de un pedido"
- I4: "Agrégalo a la API como `POST /orders/:id/cancel`, `POST /orders/:id/fulfill` y `GET /orders/:id`"

## USER MESSAGES

(none)

## ANSWERS

- D1: "Solo el comprador"
- D2: "Solo el vendedor de la publicación"
- D3: "Comprador, vendedor y administradores"
- D4: "No hay referencias"
- D5: "Solo pedidos abiertos"
- D6: "El ranking se queda como está"
- D7: "Elige tú"
- D8: "Ninguna"
- Shared-understanding check: "Coincide"
