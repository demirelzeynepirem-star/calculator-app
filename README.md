# Calculator App

A React and Go calculator. Enter a math expression, and the backend returns the result.

[Repository](https://github.com/demirelzeynepirem-star/calculator-app) · [CI checks](https://github.com/demirelzeynepirem-star/calculator-app/actions) · [Coverage report](reports/coverage.md) · [AI prompts](PROMPTS.md)

The repository is private. Reviewers need access.

## Run locally

| Tool | Version |
| --- | --- |
| Go | 1.27.1 used in CI and Docker; minimum language version is 1.22 |
| Node.js | 22.22.2 or newer |
| npm | 10 |
| Docker | Optional |

From the main project folder, start the backend:

```bash
go run ./cmd/server
```

In a second terminal, start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173**. The API runs on port **8080**.

To change the API port, set `PORT` for the backend and `API_PROXY_TARGET` for the frontend.

### Run with Docker

| Action | Command from the main folder |
| --- | --- |
| Build and start both services | `docker compose up --build` |
| Stop both services | `docker compose down` |

Open **http://localhost:3000**. Nginx serves the frontend and sends API requests to Go.

## What is included and what is not

| Feature | Status | Example or limit |
| --- | --- | --- |
| Basic math | Included | Addition, subtraction, multiplication, and division |
| Multi-step expressions | Included | `(3 + 5) * 2 = 16`; nested brackets and math order work. |
| Decimals and negative numbers | Included | `-3.5 + 5 = 1.5` |
| Powers, square root, percentage | Included | `2 ^ 3 = 8`, `sqrt(81) = 9`, `25% * 200 = 50` |
| Continue from a result | Included | `2 + 3 = 5`, then `× 4 = 20` |
| Repeat equals | Included | `2 + 3 = 5`, then `=` gives `8`, then `11` |
| Input checks and errors | Included | Reject invalid input and division by zero. |
| Input size limits | Included | Up to 500 characters and a 4 KB request body. |
| Keyboard and mobile layout | Included | Type an expression or use the screen buttons. |
| Tests and coverage report | Included | Backend, frontend, and browser tests; see [coverage](reports/coverage.md). |
| Docker setup | Included | Run both services with Docker Compose. |

Not included: rate limiting, scientific functions, variables, scientific notation, multiplication without `*`, and exact decimal math.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/calculate` | Calculate an expression |
| GET | `/api/health` | Return `{"status":"ok"}` |

### API example

```bash
curl http://localhost:8080/api/calculate \
  -H 'Content-Type: application/json' \
  -d '{"expression":"3 + 5 * 2"}'
```

Response:

```json
{"expression":"3 + 5 * 2","result":13}
```

| Status | Meaning |
| --- | --- |
| 200 | Calculation succeeded |
| 400 | Invalid JSON, extra fields, or input over the size limit |
| 422 | Invalid expression, such as division by zero |
| 500 | Unexpected calculation error |

## Tests and coverage

Install frontend packages with `npm ci` before running frontend checks or coverage.

| Check | Folder | Command |
| --- | --- | --- |
| Backend tests | Main folder | `go test -race -cover ./cmd/... ./internal/...` |
| Go code checks | Main folder | `go vet ./cmd/... ./internal/...` |
| Frontend checks, tests, and build | `frontend` | `npm run check` |
| Install test browser once | `frontend` | `npx playwright install chromium` |
| Desktop and mobile tests | `frontend` | `npm run test:e2e` |
| Coverage for both layers | Main folder | `node scripts/coverage.mjs` |

See the measured results in the [coverage report](reports/coverage.md). The coverage command also creates `reports/backend.html` and `reports/frontend/index.html`.

Browser tests use their own ports: **18081** for the API and **14173** for the frontend. They fail if a port is busy, so they cannot use an old server.

CI runs tests, builds both Docker images, checks for known security problems, and saves the `coverage-reports` artifact.

## Design choices

| Choice | Reason or rule |
| --- | --- |
| Backend calculations | React sends expressions to Go; it does not calculate answers. |
| Separate parser | Math code can be tested without HTTP. It does not use `eval`. |
| Normal math order | Multiplication comes before addition. Powers run from right to left. |
| Simple percentage | `10%` means `0.1`, so `100 + 10% = 100.1`. |
| Repeat equals | Repeat the final operation. For `3 + 5 * 2`, add `10` again. Editing the input resets this. |
| Old requests | Cancel them and ignore late results when the input changes. |

## AI use

The author chose the scope, technologies, and design, and proposed continuing from the last result. AI helped write the code and later fixes. The available requests and limits of the record are in [PROMPTS.md](PROMPTS.md).
