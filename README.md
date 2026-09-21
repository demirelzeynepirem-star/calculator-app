# Expression Calculator

A focused take-home project: a React calculator backed by a small Go HTTP service. Unlike a two-input demo, it evaluates full expressions such as `3 + 5 * 2` and `(3 + 5) * 2` with conventional operator precedence.

## Features

- Full expressions with `+`, `-`, `*`, `/`, `^`, parentheses, and unary signs
- Optional operations kept deliberately small: `sqrt(...)` and postfix `%` (`25%` is `0.25`)
- Responsive keypad plus direct keyboard input
- Friendly, positional validation errors; division-by-zero and non-finite-result protection
- Independently tested calculation, HTTP, API-client/UI boundaries, plus a real browser-to-API flow

## Architecture

```text
frontend (React + TypeScript + Vite)
  App.tsx                 UI and interaction state
  api/calculatorApi.ts    HTTP boundary
            │ POST /api/calculate
            ▼
backend (Go standard library)
  internal/api            transport, JSON validation, CORS
  internal/calculator     recursive-descent parser and evaluator
  cmd/server              process entry point
```

The calculator package has no HTTP dependency, and the UI has no calculation logic. The parser is intentionally implemented in-project: it is small, safe (no `eval`), easy to test, and demonstrates precedence directly. API failures include both a stable machine-readable `code` and a user-facing `error`.

## Run locally

Prerequisites: Go 1.22+ and Node.js 22.22.2+.

Terminal 1:

```bash
go run ./cmd/server
```

Terminal 2:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the backend at `http://localhost:8080`; production can serve the two artifacts behind the same origin. Set `PORT` to change the backend port.

### Run with Docker

With Docker Desktop running, build and start both services:

```bash
docker compose up --build
```

Open `http://localhost:3000`. The frontend container serves the production build through Nginx and forwards `/api` requests to the Go container. The API is available through the same origin at `http://localhost:3000/api`; Compose deliberately does not publish the backend port directly.

Stop the services with:

```bash
docker compose down
```

## API

`POST /api/calculate`

```json
{ "expression": "sqrt(81) + 2 ^ 3" }
```

```json
{ "expression": "sqrt(81) + 2 ^ 3", "result": 17 }
```

Malformed JSON returns `400`; a syntactically or mathematically invalid expression returns `422` with `{ "code": "invalid_expression", "error": "..." }`. A health check is available at `GET /api/health`. Every response contains an `X-Request-ID`, and the API emits a compact request log with status and duration.

## Test and build

```bash
go test ./cmd/... ./internal/...
go test -race -cover ./cmd/... ./internal/...
go vet ./cmd/... ./internal/...

cd frontend
npm ci
npm run check

# One-time browser installation, then full browser-to-API verification
npx playwright install chromium
npm run test:e2e
```

`npm run check` runs lint, type checking, unit/component tests, and the production build. The GitHub Actions workflow repeats these checks, runs the Go race detector, audits npm dependencies, builds both container images, runs the browser tests, and scans the images for high/critical vulnerabilities. Dependabot proposes weekly dependency and workflow updates.

## Design decisions and assumptions

- Scope favors a reliable arithmetic expression evaluator over scientific-calculator breadth.
- Exponentiation is right-associative (`2^3^2` equals `2^(3^2)`).
- Percent is a postfix number conversion: `25% * 200` equals `50`; context-sensitive calculator semantics such as `100 + 10% = 110` are intentionally excluded.
- Expressions are limited to 500 Unicode characters and request bodies to 4 KB.
- Currency formatting, history, persistence, authentication, and deployment are excluded to stay within the assignment's 2–4 hour target.

## Reliability and security

- The HTTP server sets read-header, read, write, and idle timeouts and performs a bounded graceful shutdown on `SIGINT`/`SIGTERM`.
- The browser cancels an in-flight calculation when the expression changes and ignores stale responses.
- Successful API responses are validated at runtime before the UI uses them.
- Containers include health checks; the backend runs as a non-root user and is reachable only through the frontend proxy in Compose.
- Nginx emits a restrictive content-security policy and common browser hardening headers.
- Runtime dependencies are version-pinned in `package.json` and fully locked in `package-lock.json`.

## Repository setup

Generated dependencies, test artifacts, caches, and build output are ignored. The Go module currently uses the repository-independent name `calculator` because this working tree has no Git remote. When the final remote is created, replace it with the canonical repository path and update the two internal imports in the same commit.
