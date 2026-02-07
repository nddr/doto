# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Doto is a Vue 3 + TypeScript single-page application using the Composition API with `<script setup>` syntax. Built with Vite 7, styled with Tailwind CSS v4, and uses Rust-powered linting/formatting tools (Oxlint/Oxfmt).

## Commands

```bash
# Development
pnpm dev                        # Start dev server (http://localhost:5173)
pnpm type-check                 # Type-check with vue-tsc

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

## State Management

No external state library—uses Vue reactivity + localStorage persistence.

**Composables** (`src/composables/`):

- `useTodoList` - Central data store for notes/todos, persists to localStorage
- `useTheme`, `useWeekLength`, `useShowCreatedAt` - User preferences (localStorage-backed)
- `useDialog`, `useToast` - UI state for modals and notifications

## Data Model

Two note types defined in `useTodoList.ts`:

- `TaskNote` - Has `todos: Todo[]` array with id, title, completed, timestamps
- `TextNote` - Has `content: string` for freeform text

Both share: `id`, `name`, `createdAt`, `currentDate`, `tags`, `autoAdvance`

## Environment Variables

Defined in `env.d.ts`, configured in `.env`:

- `VITE_API_BASE_URL` - API endpoint
- `VITE_CLASSIC_APP_URL` - Classic app URL
- `VITE_APP_ENV` - Environment mode (development | staging | production)

## Code Generation
- Do not build or test code after generation.

## Vue Directive Patterns

**Keep event handlers declarative - extract logic into methods**

❌ **Avoid:**
```vue
  <button @click="count++">Increment</button>
  <input @input="user.name = $event.target.value">
```

✅ **Prefer:**
```vue
<button @click="incrementCount">Increment</button>
<input @input="updateUserName">
```

```typescript
  function incrementCount() {
    count.value++
  }

  function updateUserName(event: Event) {
    user.value.name = (event.target as HTMLInputElement).value
  }
```

**Why:** Keeps templates readable, makes logic testable, and enables better type safety.

## Icons

**Use SVG images instead of ASCII characters for icons**
