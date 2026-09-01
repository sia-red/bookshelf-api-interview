# Ejercicio de entrevista

> English version: [`INTERVIEW.md`](./INTERVIEW.md)

`bookshelf-api-interview` es una API REST pequeña para el catálogo de una biblioteca. Su arquitectura,
las reglas de capas y sus convenciones están en **`README.md` — léelo primero.** Todo lo de abajo lo
da por sentado.

Tienes **10 minutos**. No esperamos que termines todo. Elige en qué gastas el reloj y prepárate para
decir qué dejaste fuera y por qué.

**Puedes usar IA.** Usa lo que uses normalmente. Nos interesa cómo la diriges y cómo compruebas lo
que te devuelve.

## Cómo arrancarlo

```bash
npm install
npm run dev      # http://localhost:3002
npm test
npm run lint
```

`api.http` tiene todas las peticiones contra este servicio, incluida una para el endpoint que vas a
escribir.

---

## Parte 1 — Cinco defectos

Este servicio se entrega con **cinco defectos conocidos**. Algunos rompen la suite de tests. Otros no.

Arregla los que encuentres. `npm test` es un buen sitio para empezar y un mal sitio para parar.

---

## Parte 2 — Falta un endpoint

### `POST /api/v1/book/:id/loan` — registrar un préstamo

Nada de este endpoint existe todavía. Lo que sí existe es su capa de datos: en `src/data/loan/` están
el modelo `Loan`, su mapper y `LoanRepository.createLoan()`, ya cableados en el contenedor. No
deberías necesitar tocarla.

Requisitos:

- Valida el parámetro `:id` y el cuerpo de la petición con el middleware de validación que este
  proyecto ya usa. El cuerpo trae `borrowerName`.
- **404** si el libro no existe, reutilizando el código que ya está en el catálogo de errores.
- **409** si el libro no tiene ejemplares disponibles, con un código de error propio.
- Crea el préstamo, descuenta uno de `copiesAvailable` del libro, y responde con el préstamo.

Si el reloj lo permite: un test del caso 409, y una línea en el README documentando el endpoint.

---

## Qué vamos a mirar

- Si un arreglo es correcto — y si cae en la capa que debe hacerse cargo de él.
- Dónde acaba viviendo la nueva regla de negocio.
- Si el contrato de respuesta se sostiene: códigos de estado, códigos de error del catálogo, y la
  envoltura de la respuesta.
- Al final te vamos a preguntar: **¿qué más está mal y no te dio tiempo?** Esa pregunta cuenta.
