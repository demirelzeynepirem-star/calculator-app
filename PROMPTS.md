# AI Assistance Disclosure

AI assistance was used as a development accelerator for this take-home assignment. Generated suggestions were reviewed as draft material rather than accepted as evidence of correctness.

## Material prompts

1. “Plan a 2–4 hour calculator take-home using a React + TypeScript + Vite frontend and a Go microservice. Include clean architecture, tests, setup documentation, and AI disclosure without overengineering.”
2. “Use expression-based calculation rather than two numeric inputs. Support examples such as `3 + 5 * 2`, parentheses, conventional precedence, and—if scope permits—power, square root, and percentage.”
3. “Build the project files, add validation and error handling, run backend/frontend tests and production builds, and leave a Git-ready repository.”

## Where assistance was used

AI suggestions informed the initial project structure, parser implementation and tests, API validation, request-cancellation behavior, UI copy and styling, container configuration, CI workflow, and documentation. No third-party repository code was copied.

## Human-review checklist

The resulting behavior is checked through:

- Go table tests, malformed-request tests, Unicode cases, and parser fuzz seeds
- Go vet, race-detector, and coverage runs in CI
- Frontend linting, strict TypeScript checking, ten unit/component/API-client tests, and a production build
- Two Playwright tests that exercise a real browser, development proxy, and Go API together
- npm audit plus high/critical container vulnerability scans in CI

Known project-level choices remain explicit: there is no authentication because the service stores no user data, percentage uses postfix conversion semantics, and the canonical Go module path must be set after a Git remote is chosen.
