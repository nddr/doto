# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Todoi is a Vue 3 + TypeScript single-page application using the Composition API with `<script setup>` syntax. Built with Vite 7, styled with Tailwind CSS v4, and uses Rust-powered linting/formatting tools (Oxlint/Oxfmt).

## Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:5173)
pnpm test:unit        # Run unit tests with Vitest
pnpm type-check       # Type-check with vue-tsc

# Building
pnpm build            # Type-check + compile for production
pnpm preview          # Preview production build

# Linting
pnpm lint             # Run all linters
pnpm lint:oxlint      # Run Oxlint with auto-fix
```

## Code Style

- Use `pnpm` (not npm or yarn)
- Single quotes, no semicolons (enforced by Oxfmt)
- Use `@/` path alias for imports from src directory
- Tailwind CSS utility classes for styling
- Composition API with `<script setup>` pattern

## Architecture

- **Entry:** `index.html` → `src/main.ts` → `App.vue`
- **Routing:** Vue Router configured in `src/router/index.ts`
- **Styling:** Tailwind CSS v4 via Vite plugin, global styles in `src/assets/css/style.css`

## Environment Variables

Defined in `env.d.ts`, configured in `.env`:
- `VITE_API_BASE_URL` - API endpoint
- `VITE_CLASSIC_APP_URL` - Classic app URL
- `VITE_APP_ENV` - Environment mode (development | staging | production)
