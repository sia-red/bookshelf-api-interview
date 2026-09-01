# Interview exercise

> Versión en español: [`INTERVIEW.es.md`](./INTERVIEW.es.md)

`bookshelf-api-interview` is a small REST API for a library catalogue. Its architecture, layer rules
and conventions live in **`README.md` — read that first.** Everything below assumes it.

You have **10 minutes**. You are not expected to finish all of it. Choose what to spend the clock on,
and be ready to say what you left out and why.

**You may use AI.** Use whatever you normally use. We are interested in how you direct it and how you
check what it gives back.

## Running it

```bash
npm install
npm run dev      # http://localhost:3002
npm test
npm run lint
```

`api.http` holds every request against this service, including one for the endpoint you are about to
write.

---

## Part 1 — Five defects

This service ships with **five known defects**. Some of them break the test suite. Others do not.

Fix as many as you find. `npm test` is a good place to start and a bad place to stop.

---

## Part 2 — One missing endpoint

### `POST /api/v1/book/:id/loan` — record a loan

None of this endpoint exists yet. What does exist is its data layer: `src/data/loan/` holds the
`Loan` model, its mapper, and `LoanRepository.createLoan()`, already wired into the container. You
should not need to touch it.

Requirements:

- Validate the `:id` param and the request body with the validation middleware this project already
  uses. The body carries `borrowerName`.
- **404** if the book does not exist, reusing the code that is already in the error catalogue.
- **409** if the book has no copies available, with an error code of its own.
- Create the loan, decrement the book's `copiesAvailable`, and answer with the loan.

If the clock allows: a test for the 409 case, and a line in the README documenting the endpoint.

---

## What we are looking at

- Whether a fix is correct — and whether it lands in the layer that should own it.
- Where the new business rule ends up living.
- Whether the response contract holds: status codes, error codes from the catalogue, the response
  envelope.
- At the end we will ask you: **what else is wrong that you did not get to?** That question counts.
