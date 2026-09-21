# Calculator App

Calculator App solves math expressions such as `3 + 5 * 2`. The frontend uses React and TypeScript. The backend uses Go and calculates the results.

The app reads each part of the expression with its own parser. It does not use `eval`, run shell commands, or use an external calculator library.

Examples:

```text
3 + 5 * 2          = 13
(3 + 5) * 2        = 16
2 ^ 3 ^ 2          = 512
sqrt(81) + 25%     = 9.25
```

## Features

Press `=` again to repeat the last operation: `2 + 3 = 5`, then `8`, then `11`. For mixed expressions, the final operation follows normal math order: `3 + 5 * 2` repeats adding `10`. Editing the input starts a new calculation.

- Add, subtract, multiply, and divide numbers
- Use brackets, positive and negative numbers, powers, square roots, and percentages
- Type with your keyboard or use the buttons on the screen
- See an error message when an expression is not valid
- Cancel an old request when you change the expression
- Use a result in the next calculation. For example, after `2 + 3 = 5`, press `×`, then `4` and `=` to get `20`. This also works with keyboard operators.
- Check the API response before showing a result
- Run tests for the calculation code, API, and frontend
- Start the app with Docker and run automatic checks with GitHub Actions

## How it works

```text
Browser
  React + TypeScript + Vite
  ├── App.tsx                 screen and user input
  ├── hooks/useCalculation.ts manages requests, results, and errors
  └── api/calculatorApi.ts    sends requests to the API
                │
                │ POST /api/calculate
                ▼
Go HTTP API
  ├── internal/api            receives and checks requests
  ├── internal/calculator     reads expressions and calculates results
  └── cmd/server              starts and stops the server
```

The frontend sends your expression to the Go API. The backend checks it and returns a result or an error. The frontend does not calculate the answer.

The calculation code is separate from the HTTP code. Calculation error responses have a `code` for the application and an `error` message for the user.

## Requirements

- Go 1.22 or newer
- Node.js 22.22.2 or newer
- npm 10
- Docker Desktop, if you want to run the app with Docker

## Quick start

Open a terminal in the main project folder and start the API:

```bash
go run ./cmd/server
```

In a second terminal, start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173` in your browser. Vite sends `/api` requests to `http://localhost:8080`.

The API uses port `8080` by default. You can set `PORT` to use another port. If you do this, also change the API address in `frontend/vite.config.ts`.

## Docker

Build and start both services:

```bash
docker compose up --build
```

Open `http://localhost:3000`. Nginx shows the frontend and sends `/api` requests to the backend. With this Docker setup, you reach the backend through Nginx.

Stop the services with:

```bash
docker compose down
```

Both containers have health checks to see if they are running. The backend runs without root permissions.

## Supported expressions

| Syntax | Meaning | Example | Result |
| --- | --- | --- | ---: |
| `+`, `-` | Addition and subtraction | `8 - 3 + 2` | `7` |
| `*`, `/` | Multiplication and division | `6 / 2 * 3` | `9` |
| `^` | Power, calculated from right to left | `2 ^ 3 ^ 2` | `512` |
| `+x`, `-x` | Positive or negative number | `-3 + +5` | `2` |
| `(…)` | Calculate this part first | `(3 + 5) * 2` | `16` |
| `sqrt(…)` | Square root | `sqrt(81)` | `9` |
| `%` | Divide the value before `%` by 100 | `25% * 200` | `50` |

Percentage always divides a value by 100. For example, `10%` means `0.1`, so `100 + 10%` gives `100.1`, not `110`.

An expression can have up to 500 Unicode characters. The request body can be up to 4 KB.

## API

### Calculate an expression

`POST /api/calculate`

Request:

```json
{
  "expression": "sqrt(81) + 2 ^ 3"
}
```

The API returns this result with status `200 OK`:

```json
{
  "expression": "sqrt(81) + 2 ^ 3",
  "result": 17
}
```

For an invalid expression such as `1 / 0`, the API returns status `422 Unprocessable Entity`:

```json
{
  "code": "invalid_expression",
  "error": "division by zero at position 3"
}
```

Invalid JSON and expressions over the length limit return `400 Bad Request`. The handler uses `500 Internal Server Error` for other calculation errors and does not show internal error details.

### Health check

`GET /api/health`

```json
{
  "status": "ok"
}
```

Each API response has an `X-Request-ID` header. This ID helps you find the request in the server logs.

## Tests and checks

Open a terminal in the main project folder and run the backend checks:

```bash
go test ./cmd/... ./internal/...
go test -race -cover ./cmd/... ./internal/...
go vet ./cmd/... ./internal/...
```

Run frontend checks:

```bash
cd frontend
npm ci
npm run check
```

`npm run check` checks code style and TypeScript types, runs tests, and builds the frontend for release.

In the `frontend` folder, install Chromium once. Then run the tests that use a real browser and the Go API:

```bash
npx playwright install chromium
npm run test:e2e
```

## Automatic checks

The GitHub Actions workflow is set up to run these checks on each push and pull request:

1. Check Go code style, possible code problems, and tests
2. Install frontend packages from the lockfile and check for known security problems
3. Check frontend code, run tests, and build the app
4. Run Playwright browser tests with the Go API
5. Build the backend and frontend Docker images
6. Scan the images for high and critical security problems

Dependabot is set up to check for npm, Go module, and GitHub Actions updates each week.

## Safety and error handling

- The parser accepts only the math operations listed above.
- The API limits the request size and expression length.
- The HTTP server has time limits for reading, writing, and waiting for requests.
- When the server receives `SIGINT` or `SIGTERM`, it allows up to 10 seconds for active requests to finish.
- The browser cancels old requests and ignores their results.
- Nginx sends security headers that limit which content the browser can load.
- The default Docker setup does not open the backend port to the host.
- Frontend package versions are fixed in `package.json` and `package-lock.json`.

## Project structure

```text
.
├── cmd/server/                starts the Go server
├── internal/api/              handles HTTP requests
├── internal/calculator/       reads expressions and calculates results
├── frontend/
│   ├── e2e/                   Playwright browser tests
│   └── src/                   React app and tests
├── .github/workflows/ci.yml    automatic checks
├── compose.yaml               runs both containers together
└── PROMPTS.md                 explains how AI was used
```

## Project limits

This is a small calculator project. It does not save expressions or results. It has no user accounts, login, or currency formatting. Square root is the only extra scientific function, and the project does not include an online deployment.

The Go module is named `calculator`. It is used inside this application and is not published as a separate library.

## AI assistance

The project author decided what the app should do and which technologies to use. The author also proposed using the last result in the next calculation. AI helped write the application and make later fixes, including this feature. See [`PROMPTS.md`](PROMPTS.md) for the prompts, the work done with AI, and the automatic checks.
