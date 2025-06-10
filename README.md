# Healthcare Commons App

This project is a React + TypeScript application built with [Vite](https://vitejs.dev). It prototypes a patient–provider connection system that supports anonymous patient sessions, provider verification, geolocation-based matching, and appointment management.

## Features
- Browser fingerprinting for anonymous sessions without PHI
- Provider registration and credential verification
- Hyperlocal provider search using geolocation
- Appointment booking with local reminders
- Multi-language support for major Indic languages
- Provider dashboard with appointment analytics

## Requirements
- Node.js 18 or later

## Getting Started
Install dependencies:

```bash
npm install
```
This installs the development dependencies needed for `npm run lint`. The lint
command will fail if a package like `@eslint/js` is missing. In CI
environments, you can instead run `npm ci` for a clean install.

Create a `.env` file with your Supabase credentials:

```bash
cp .env.example .env
```
Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

## Scripts
- `npm run build` – Build a production bundle in `dist/`.
- `npm run lint` – Run ESLint on the project (currently fails due to TypeScript lint errors).
- `npm run preview` – Preview the production build.

## Project Motivation
The Healthcare Commons App provides a foundation for anonymously matching patients with local healthcare providers. It demonstrates patient session management without storing PHI, provider credential verification, appointment scheduling, and multiple language interfaces.

