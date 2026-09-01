# `core/persistence/`

The single boundary between the application and whatever stores its data.

- **`store.ts`** — the port. Engine-neutral `RawRecord`, `RawQuery` and `Store` interfaces. This is
  the only vocabulary the rest of the codebase knows.
- **`memory-store.ts`** — the adapter shipped with this project. Holds every record in a `Map`, so
  the API boots with no database, no container and no migration.
- **`store-factory.ts`** — the one value-level entry point. `initializePersistence()` is called once
  at startup; everything else calls `getStore()`.

## Rules

1. No file outside this folder may import `memory-store.ts`. Consumers depend on the interfaces in
   `store.ts`, never on the implementation.
2. Only `data/` talks to the store. A controller or service that calls `getStore()` has skipped the
   repository and the mapper, and with them every guarantee those two layers provide.
3. `RecordNotFoundError` is the port's own failure type. Translating it into an HTTP status is the
   caller's job, not the store's.

## Swapping the engine

Implement `Store` against the new engine and return it from `initializePersistence()`. If a consumer
needs to change, the port was leaking.
