import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const reports = resolve(root, 'reports')
mkdirSync(reports, { recursive: true })

function run(command, args, cwd = root, extraEnv = {}) {
  return execFileSync(command, args, {
    cwd,
    env: { ...process.env, ...extraEnv },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
}

const goEnv = { GOCACHE: resolve(root, 'work/go-cache') }
console.log(
  run(
    'go',
    [
      'test',
      '-race',
      '-coverprofile=reports/backend.out',
      './cmd/...',
      './internal/...',
    ],
    root,
    goEnv,
  ),
)
const backend = run(
  'go',
  ['tool', 'cover', '-func=reports/backend.out'],
  root,
  goEnv,
)
run(
  'go',
  ['tool', 'cover', '-html=reports/backend.out', '-o', 'reports/backend.html'],
  root,
  goEnv,
)
console.log(run('npm', ['run', 'test:coverage'], resolve(root, 'frontend')))
const summary = JSON.parse(
  readFileSync(resolve(reports, 'frontend/coverage-summary.json'), 'utf8'),
)
const portableSummary = Object.fromEntries(
  Object.entries(summary).map(([file, value]) => [
    file === 'total' ? file : relative(root, file),
    value,
  ]),
)
writeFileSync(
  resolve(reports, 'frontend/coverage-summary.json'),
  JSON.stringify(portableSummary, null, 2) + '\n',
)
const total = summary.total
const backendTotal = backend.match(/total:\s+\(statements\)\s+(\S+)/)?.[1]
if (!backendTotal) throw new Error('Backend coverage total is missing')
const report = [
  '# Coverage report',
  '',
  'Measured on ' +
    new Date().toISOString().slice(0, 10) +
    ' with Node ' +
    process.version +
    '.',
  'Run `node scripts/coverage.mjs` from the project root to update this report.',
  '',
  '| Layer | Statements | Branches | Functions | Lines |',
  '| --- | ---: | ---: | ---: | ---: |',
  '| Backend | ' +
    backendTotal +
    ' | Not measured by Go | Not measured by Go | Not measured by Go |',
  '| Frontend | ' +
    total.statements.pct +
    '% | ' +
    total.branches.pct +
    '% | ' +
    total.functions.pct +
    '% | ' +
    total.lines.pct +
    '% |',
  '',
  'Backend includes the server entry point, API, and parser. Frontend includes all application TypeScript files, including main.tsx. Tests, test helpers, and type declarations are excluded.',
  '',
  'The server startup and browser entry point are not directly covered by unit tests. Browser tests run separately and are not part of these percentages. Coverage shows which code ran; it does not prove that every case is correct.',
  '',
  'Raw reports: [backend](backend.out), [frontend](frontend/coverage-summary.json).',
  'The command also creates local HTML reports at reports/backend.html and reports/frontend/index.html. CI saves the reports as a downloadable artifact.',
  '',
  '## Backend details',
  '',
  '```text',
  backend.trim(),
  '```',
  '',
]
writeFileSync(resolve(reports, 'coverage.md'), report.join('\n'))
console.log(report.join('\n'))
