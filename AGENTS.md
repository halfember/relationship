# Repository Guidelines

## Project Structure & Module Organization

This repository contains a relationship-management product with three deployable applications:

- `server/`: NestJS API, Prisma schema/migrations, and Node-based tests in `server/test/`.
- `web/`: Vue 3/Vite administrative client; routes live in `web/src/pages/`.
- `miniapp/`: uni-app WeChat Mini Program; pages and API clients are under `miniapp/src/`.
- `docs/`: product and operational documentation. Deployment helpers are in `scripts/`.

Group backend features in `server/src/<domain>/` with their module, controller, service, and DTOs. Add database changes as new timestamped directories under `server/prisma/migrations/`; never modify applied migrations.

## Build, Test, and Development Commands

Install dependencies separately in each application directory with `npm install`.

- `docker compose up -d mysql redis`: start local MySQL and Redis.
- `cd server; npm run start:dev`: run the API with file watching.
- `cd server; npm run check`: type-check, build, and run all server tests.
- `cd web; npm run dev`: launch the web client; `npm run check` validates its production build.
- `cd miniapp; npm run dev:mp-weixin`: build WeChat development output; use `npm run check` for production validation.
- `cd server; npm run prisma:generate` and `npm run prisma:migrate:prod`: regenerate Prisma client and apply existing migrations.

## Coding Style & Naming Conventions

Use TypeScript for server and web code, with four-space indentation and semicolons. Name NestJS classes in PascalCase (`CreateRelationshipDto`), files in kebab-case (`relationship.service.ts`), web components in PascalCase, and miniapp page directories in lowercase. Keep validation in DTOs and business rules in services or focused helpers.

## Testing Guidelines

Server tests are standalone Node scripts named `server/test/<feature>.test.js`. Add or update focused tests for backend behavior, then run `cd server; npm run check`. Validate client changes with the relevant `check` command; manually verify Mini Program UI flows in WeChat Developer Tools.

## Commit & Pull Request Guidelines

Use Conventional Commit-style subjects, such as `feat: refresh relationship workflows` or `fix: enable component lazy loading`. Keep commits focused. Pull requests should explain behavior, identify schema or configuration changes, link issues, and include UI screenshots.

## Security & Configuration

Create local `.env` files from committed `*.env.example` templates. Never commit credentials, keys, certificates, uploads, backups, or generated output. Preserve existing authentication and ownership checks for API changes.
