# bookshelf-api-interview

A small REST API for a library catalogue, written as a **reference for a layered architecture**. It
is deliberately narrow — one entity, three endpoints — so the structure is the thing you read, not
the feature list.

Two production dependencies: `express` and `valibot`. No database, no container, no build step to run
it. `npm install && npm run dev` and it answers.

## Running it

Node 22.9 or newer (the dev script uses Node's own `--env-file-if-exists`).

```bash
npm install
npm run dev                      # http://localhost:3002, restarts on change
npm test                         # node:test, ~30 tests, no watch
npm run build                     # type-check and emit to dist/
npm run lint
```

`cp .env.example .env` if you want to change the port. Every variable has a default, so it is
optional.

`api.http` at the root holds every request, failures included — open it with the REST Client
extension and click through. Or with curl:

```bash
curl http://localhost:3002/health
curl 'http://localhost:3002/api/v1/book?pageSize=3&sortBy=publishedYear&sortOrder=desc'
curl http://localhost:3002/api/v1/book/book-001
```

## Endpoints

| Method and path        | What it does                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `GET /api/v1/book`     | Paginated list with `page`, `pageSize`, `search`, `sortBy`, `sortOrder`. Returns `meta`.  |
| `GET /api/v1/book/:id` | One book, detail shape. `404` with a catalogue error code when it does not exist.         |
| `POST /api/v1/book`    | Adds a book. `409` on a duplicate ISBN, `400` when the copy counts contradict each other. |
| `GET /health`          | Liveness. Outside the version prefix on purpose.                                          |

The catalogue ships with 42 records, two of them soft-deleted — so a list total of **40** is the
correct answer, not a bug.

## Out of scope

There is **no authentication, no authorization and no multi-tenancy** in this project, and none is
expected. No login, no tokens, no sessions, no permission checks, no per-organisation scoping. Every
request is anonymous and sees the whole catalogue.

That is a deliberate cut, not an oversight: those three concerns would double the size of the code
without adding anything to what this project is here to show.

## Layout

```
src/
├── config/            # environment variables and shared constants
├── core/              # infrastructure, with no knowledge of the domain
│   ├── errors/        # AppError + the error-code catalogue
│   ├── http/          # request context, response envelope, error handler
│   ├── logger/        # a ~40-line logger, no dependency
│   ├── persistence/   # the Store port + its in-memory adapter
│   ├── schemas/       # the shared list-query contract
│   ├── utils/
│   └── validation/    # the validate() middleware
├── data/              # data access, one folder per entity
│   ├── base/          # BaseRepository, BaseMapper, ListMapper
│   ├── book/          # book repository · mapper · types
│   └── fixtures/      # the shipped catalogue
├── features/          # one folder per feature
│   └── book/          # routes · schemas · controller · service
├── bootstrap/         # the dependency container
├── app.ts             # assembles the Express app
└── server.ts          # loads config, seeds, wires, listens
```

## The path of a request

```
Route → validate() → Controller → Service → Repository → Mapper → response envelope
```

The service is skipped when there is no rule to apply: a plain read goes from the controller
straight to the repository. It is not skipped when there is one.

## Layer rules

| Layer        | May import from  | The rule being kept                                                            |
| ------------ | ---------------- | ------------------------------------------------------------------------------ |
| `features/`  | `data/`, `core/` | A controller never imports another controller, and never reaches the store.    |
| `data/`      | `core/`          | A repository never injects another repository. Orchestration belongs upstairs. |
| `core/`      | `core/` only     | Knows nothing about books, or about any feature.                               |
| `bootstrap/` | anything         | Wiring only. Never a business rule.                                            |

One direction only. If a layer needs something from the layer above it, the thing is in the wrong
place.

## Conventions

**One response shape.** Success is `{ success: true, data, meta? }`, failure is
`{ success: false, error: { code, message, details? } }`. Build it with `successResponse()`; the error
half is produced by the error handler alone.

**One error path.** Throw an `AppError` with a code from `core/errors/error-codes.ts`. A single
handler turns it into a status and a body. No controller writes an error response by hand, and no
handler returns `200` with an empty payload to signal a miss.

**The list contract is shared.** `core/schemas/list.schema.ts` builds it, and it requires the caller
to declare `sortableFields`. `sortBy` becomes a column name in the store, so the accepted values are
part of the endpoint's contract — never free text from the client.

**A mapper per response shape.** `toModel` builds the domain model field by field; `toListItem` and
`toDetail` project it for their endpoint. A record carries columns that are internal to the library —
`acquisitionCost` is one — and mapping explicitly is what keeps them internal. A mapper that copies
whatever it finds publishes whatever it finds, and no type error will tell you.

**Business rules live in the service.** The controller reads the request and writes the response. The
repository reads and writes records. Whether an operation is allowed at all is decided in between.

**Records are never dropped.** `softDelete` sets a flag and `createQuery()` filters on it, in one
place. History that points at a record survives the record being withdrawn.

**Every read and write takes a `RequestContext` first.** It carries the request id, so a log line in
the repository can be tied to the request that caused it.

**Controllers are static and stateless.** They resolve their collaborators from the container at call
time; nothing about a request is stored on them.

## Persistence

`core/persistence/` holds the whole story: a port (`store.ts`) and the in-memory adapter that
implements it (`memory-store.ts`). Nothing else in the codebase names the engine, and only `data/`
talks to the store at all. See `core/persistence/README.md`.

## Testing

`node:test`, no test framework. `tests/helpers/test-app.ts` builds a store loaded with the fixture, a
wired container, and — for the contract tests — a real server on an ephemeral port that is driven
with `fetch`. Three levels are covered: the generic repository behaviour, the mapper's field
discipline, and the HTTP contract of the live routes.
