# Private record — pause-listing

## IDEA

Quiero que los vendedores puedan pausar una publicación sin perder su ranking, y reanudarla después. Agrégalo a la API de publicaciones como `POST /listings/:id/pause` y `POST /listings/:id/resume`; una publicación pausada tiene status `paused`.

## IDEA ITEMS

- I1: "puedan pausar una publicación sin perder su ranking"
- I2: "y reanudarla después"
- I3: "Agrégalo a la API de publicaciones como `POST /listings/:id/pause` y `POST /listings/:id/resume`"
- I4: "una publicación pausada tiene status `paused`"

## USER MESSAGES

(none)

## ANSWERS

- D1: "El vendedor dueño de la publicación y los admins; a cualquier otro se le rechaza"
- D2: "No aparece en la búsqueda; por id se sigue devolviendo, con status paused"
- D3: "No se puede pedir una publicación pausada"
- D4: "El rankScore se conserva exacto al pausar y al reanudar"
- D5: "Pausar una ya pausada, o reanudar una activa, se acepta y no cambia nada"
- D6: "Si el id no existe, lo mismo que hoy: 404 listing_not_found"
- D7: "Solo la API; la pausa no tiene límite de tiempo ni termina sola"
