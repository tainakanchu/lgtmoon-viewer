# lgtmoon-viewer

A browser-side viewer wrapper for [LGTMoon](https://lgtmoon.dev/) images. Browse random LGTM images, keep favorites, hide ID ranges you dislike, and back up all local state as JSON.

All data is stored in `localStorage`; no server is involved.

## Features

- **Random** — fetch random LGTM images by probing the LGTMoon ID space
- **Favorites** — star images and revisit them later
- **Ignore ranges** — hide ID ranges you never want to see
- **Settings** — tune probe behavior and display preferences
- **Backup / Restore** — export/import favorites, ignore ranges, and settings as JSON

## Stack

React 19 · TypeScript · Vite · React Router

## Development

```sh
pnpm install
pnpm dev          # start dev server
pnpm build        # type-check + production build
pnpm lint         # ESLint
```

## Deployment

Pushes to `main` / `master` are deployed to GitHub Pages via `.github/workflows/deploy.yml`.
