# Coverage report

Measured on 2026-09-21 with Node v22.23.1.
Run `node scripts/coverage.mjs` from the project root to update this report.

| Layer | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Backend | 83.6% | Not measured by Go | Not measured by Go | Not measured by Go |
| Frontend | 89.09% | 81.06% | 92.3% | 91.83% |

Backend includes the server entry point, API, and parser. Frontend includes all application TypeScript files, including main.tsx. Tests, test helpers, and type declarations are excluded.

The server startup and browser entry point are not directly covered by unit tests. Browser tests run separately and are not part of these percentages. Coverage shows which code ran; it does not prove that every case is correct.

Raw reports: [backend](backend.out), [frontend](frontend/coverage-summary.json).
The command also creates local HTML reports at reports/backend.html and reports/frontend/index.html. CI saves the reports as a downloadable artifact.

## Backend details

```text
calculator/cmd/server/main.go:16:			main			0.0%
calculator/cmd/server/main.go:22:			run			0.0%
calculator/internal/api/handler.go:34:			NewHandler		100.0%
calculator/internal/api/handler.go:46:			WriteHeader		100.0%
calculator/internal/api/handler.go:51:			withRequestLogging	100.0%
calculator/internal/api/handler.go:62:			newRequestID		75.0%
calculator/internal/api/handler.go:70:			health			0.0%
calculator/internal/api/handler.go:74:			calculate		90.9%
calculator/internal/api/handler.go:104:			withCORS		100.0%
calculator/internal/api/handler.go:120:			writeJSON		100.0%
calculator/internal/calculator/calculator.go:18:	Error			0.0%
calculator/internal/calculator/calculator.go:25:	Evaluate		91.7%
calculator/internal/calculator/calculator.go:49:	parseExpression		100.0%
calculator/internal/calculator/calculator.go:73:	parseTerm		88.9%
calculator/internal/calculator/calculator.go:101:	parseUnary		100.0%
calculator/internal/calculator/calculator.go:114:	parsePower		90.0%
calculator/internal/calculator/calculator.go:130:	parsePostfix		100.0%
calculator/internal/calculator/calculator.go:144:	parsePrimary		84.0%
calculator/internal/calculator/calculator.go:180:	parseNumber		100.0%
calculator/internal/calculator/calculator.go:209:	skipSpaces		100.0%
calculator/internal/calculator/calculator.go:214:	atEnd			100.0%
calculator/internal/calculator/calculator.go:215:	peek			100.0%
calculator/internal/calculator/calculator.go:221:	consume			100.0%
calculator/internal/calculator/calculator.go:228:	hasWord			100.0%
calculator/internal/calculator/calculator.go:229:	errorf			100.0%
total:							(statements)		83.6%
```
