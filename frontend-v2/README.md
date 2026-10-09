# ResiduGuard frontend v2

An independent React, Vite, TypeScript, Tailwind CSS, and React Router app. The existing root frontend and backend remain separate.

## Development

Install dependencies with Bun, copy `.env.example` to `.env.local`, and set `VITE_API_BASE_URL` to the backend origin (the current backend defaults to `http://localhost:3000`). Then run:

```sh
bun install
bun run dev
```

Available checks and production build:

```sh
bun run typecheck
bun run lint
bun run build
```

## Structure

- `src/app` – route definitions
- `src/pages` – route-level screens
- `src/layouts` – shared accessible shell
- `src/components/ui` – reusable form, feedback, status, and dialog primitives
- `src/features/auth` – auth context, route guards, role maps, session persistence, and role-specific schemas
- `src/services/api` – API base configuration and typed endpoint functions
- `src/types` – API contracts
- `src/styles.css` – Tailwind import and shared design primitives

Authentication uses the verified backend endpoints `POST /api/auth/login` and `POST /api/auth/register`. Registration pages use role-specific schemas and send only the fields supported by the matching backend branch. Registration is followed by a separate sign-in because registration does not return a JWT. Public `/verify` explains that batch verification is unavailable until a backend lookup endpoint exists.

Run mocked contract and session tests with `bun run test`. They do not create database records.

## Current backend limitations

- Login returns a JWT in JSON and does not issue an HttpOnly cookie or provide a current-user/refresh endpoint. The frontend persists the session in JavaScript-readable local storage to survive refresh; this is not a secure token store. Logout only clears the browser copy because the backend has no token-revocation endpoint.
- Dashboard route guards are for navigation only. Registration accepts a client-provided role (including `AUTHORITY`), and backend APIs do not enforce role authorization. A user can tamper with client state or requests; frontend checks cannot prevent that.
- The current cattle endpoint is unscoped and does not check the JWT, so frontend dashboards intentionally do not request or display its results.
- Registration failures return safe validation messages for recognized conflicts. Unexpected registration errors return a generic response, and the handler does not log request bodies or exception details.
- There is no consumer batch-verification endpoint, so `/verify` does not submit or fabricate lookup results.
