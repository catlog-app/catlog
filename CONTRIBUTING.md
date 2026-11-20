# Contributing

Thank you for your interest. This is a small personal project, and help is welcome.

## Principles

These rules keep the app safe and simple. A change that breaks them will not be merged.

1. **Data stays on the device.** No backend, no account, no analytics, no tracker.
2. **No network requests after the app loads.** No CDN, no web fonts, no external scripts or images.
3. **Few dependencies.** Add a package only if it saves real work. Explain why in the pull request.
4. **Simple text.** All text is in [`src/strings.ts`](src/strings.ts). Write simple English that a B1 reader understands: short sentences, common words, no idioms, no jokes.

## Set up

```sh
npm ci
npm run dev
```

Before you open a pull request:

```sh
npm run lint
npm run format
npm test
npm run build
npm run test:e2e   # first run: npx playwright install chromium
```

## Code style

- TypeScript in strict mode. No `any`.
- Keep pure logic in `src/logic/` with unit tests. Keep UI code thin.
- Add a short comment where the reason is not obvious. Do not comment what the code already says.
- Test data must be **synthetic**. Never use real names, e-mails or real backups, also not in screenshots.

## Commits and pull requests

- Write the commit message as one short sentence with a capital letter, for example `Add dark theme to the calendar`.
- Keep one topic in one pull request.
- Fill in the pull request template.

## Careful review

The maintainer reads the full diff of these files before merging:
`package.json`, `package-lock.json`, `.github/workflows/`, `vite.config.ts` (service worker, manifest, Content Security Policy), and the storage, import and export code.
Why: a changed app file runs on the phones of all users.

## Translations

Text lives in one file, so a translation is possible. Open an issue first, so we can agree on how to load languages without extra requests.

## Report a security problem

Do not open a public issue. See [SECURITY.md](SECURITY.md).
