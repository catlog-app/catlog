# Security

## Report a problem

Please report security problems **in private**: use [GitHub private vulnerability reporting](https://github.com/catlog-app/catlog/security/advisories/new).
Do not open a public issue and do not post real user data.

This is a small personal project. Reports are answered as soon as possible, but there is no promised time.

## Threat model

catlog has **no server and no accounts**. There is no data in the cloud that could leak.
The data of a user lives only in the browser on their device.

What can still go wrong:

| Risk                                                                                                                                                           | What helps                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Changed app code.** The app is served from this repository. If someone changes the code, they can read the local data of everyone who opens the new version. | Protected `main` branch, 2FA on the maintainer account, manual review of all pull requests, few dependencies, pinned actions. |
| **A bad dependency.**                                                                                                                                          | Lock file, `npm ci`, install scripts off (`.npmrc`), Dependabot with manual review, `npm audit` in CI.                        |
| **Another site on the same origin.** Browser storage belongs to the origin, not to the path.                                                                   | Use a separate origin for the app (own organization or domain).                                                               |
| **Someone with access to the phone or to a backup file.**                                                                                                      | Phone lock. The app does **not** encrypt the storage or the backup file.                                                      |

Out of scope: the browser, the operating system and the phone itself.

## What the app does to limit damage

- A strict **Content Security Policy** in a `<meta>` tag: scripts and styles only from the app itself, `connect-src 'none'`, no frames, no forms.
  Limits: GitHub Pages cannot send headers, so `frame-ancestors` does not work. A person who controls the repository can change the policy. The policy protects from mistakes and injected content, not from a stolen account.
- No inline scripts and no inline styles.
- The backup file is read as **untrusted input**: strict checks of every field, size limit, unknown fields are dropped.
- Text that starts with `=`, `+`, `-` or `@` gets a quote in front in exports, so a spreadsheet does not run it as a formula.

## How the repository is protected

These settings cannot be kept in code. If you deploy a fork, you can use this list too.
The maintainer account uses two-factor authentication, and the app has its own organization and Pages origin.

**Repository**

- [ ] Ruleset for `main`: pull request required, no force push, no deletion, status check `check` required. Required approvals: 0 for a single maintainer.
- [ ] Secret scanning and push protection are on.
- [ ] Dependabot alerts and security updates are on. Private vulnerability reporting is on.
- [ ] Pages source is **GitHub Actions**. The `github-pages` environment allows deploys only from `main`.
- [ ] Actions: default token permission is **read**. Fork pull requests need approval for all outside contributors.
- [ ] There are **no secrets** in the repository and none are needed.

**Review rules**

- Never merge an outside pull request without reading the full diff.
  Look closely at `package.json`, `package-lock.json`, `.github/workflows/`, `vite.config.ts` (service worker, manifest, CSP).
- Third-party actions are pinned to a commit SHA.
- Test data is synthetic. Backups are ignored by `.gitignore` (`*backup*.json`).
