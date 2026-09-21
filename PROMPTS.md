# AI Assistance Disclosure

The project author defined the scope and technology choices: a 2–4 hour calculator take-home using React, TypeScript, Vite, and a Go microservice. The implementation and subsequent corrections were developed with AI assistance.

## Material prompts

1. “Plan a 2–4 hour calculator take-home using a React + TypeScript + Vite frontend and a Go microservice. Include clean architecture, tests, setup documentation, and AI disclosure without overengineering.”
2. “Use expression-based calculation rather than two numeric inputs. Support examples such as `3 + 5 * 2`, parentheses, conventional precedence, and—if scope permits—power, square root, and percentage.”
3. “Build the project files, add validation and error handling, run backend/frontend tests and production builds, and leave a Git-ready repository.”

## Where assistance was used

AI helped with the project structure, calculation code, tests, API checks, request cancellation, screen design, Docker, CI, documentation, and later fixes. The author chose the scope and technologies and proposed the later feature below. AI helped write the code for these choices.

## Later feature idea

The author reported that pressing equals a second time did not continue the calculation. AI helped add repeated equals and tests.

The author also asked for a more memorable interface with pink and lilac colors. AI helped update the layout and styles.

The project author proposed using the last result in the next calculation. For example, after `2 + 3 = 5`, pressing `×` and then `4` starts `5 * 4`. AI helped add the code and tests for this idea.

## Automated verification

The repository includes the following automated checks. Their presence does not establish that a human reviewed every implementation detail or that every CI check has completed successfully:

- Go table tests, malformed-request tests, Unicode cases, and parser fuzz seeds
- Go vet, race-detector, and coverage runs in CI
- Frontend linting, strict TypeScript checking, unit/component/API-client tests, and a production build
- Playwright tests that exercise a real browser, development proxy, and Go API together
- npm audit plus high/critical container vulnerability scans in CI

The app has no login and stores no user data. Percentage divides a value by 100. The Go module is named `calculator` and is used only inside this app.
