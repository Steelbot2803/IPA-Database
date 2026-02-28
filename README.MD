# IPA Database

Internal SvelteKit application for managing IPA-related database workflows.

> **Visibility note:** This repository is intended to stay private for internal use. There is a small chance it may be made public in the future, so this README is written to be safe for either case.

## Tech Stack

- SvelteKit + TypeScript
- Tailwind CSS
- Supabase

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` — start local dev server
- `npm run build` — build for production
- `npm run preview` — preview production build
- `npm run check` — run Svelte/TypeScript checks
- `npm run lint` — run Prettier + ESLint checks

## Notes

- Keep sensitive credentials in environment variables and never commit secrets.
- If this project becomes public, review code, commit history, and configuration files for private/internal details before publishing.

## Role Setup (Supabase RLS)

Role behavior:

- `GUEST`: read-only
- `USER`: read + create + update
- `ADMIN`: full CRUD + role management
