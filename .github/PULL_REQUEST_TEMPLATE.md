## What changes

<!-- One or two short sentences. -->

## Checklist

- [ ] `npm run lint`, `npm test` and `npm run build` pass.
- [ ] Is the text simple enough for B1? All text is in `src/strings.ts`.
- [ ] No new network request, no external script, font or image.
- [ ] No new dependency. If there is one, explain why it is needed.
- [ ] No real data (names, e-mails, backups) in code, tests or screenshots.

## Needs a careful review

Tick if the change touches one of these. The maintainer reviews the full diff.

- [ ] `package.json` or `package-lock.json`
- [ ] `.github/workflows/`
- [ ] The service worker or the manifest (`vite.config.ts`)
- [ ] The Content Security Policy (`vite.config.ts`)
- [ ] Storage, import or export code (`src/db.ts`, `src/logic/backup.ts`)
