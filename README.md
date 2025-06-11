# Healthcare Commons App

This project is a React + TypeScript application built with [Vite](https://vitejs.dev). It prototypes a patient–provider connection system that supports anonymous patient sessions, provider verification, geolocation-based matching, and appointment management. The backend uses GraphQL with Apollo Server and Express.

## Features
- Browser fingerprinting for anonymous sessions without PHI
- Provider registration and credential verification
- Hyperlocal provider search using geolocation
- Appointment booking with local reminders
- Multi-language support for major Indic languages
- Provider dashboard with appointment analytics
- GraphQL API with Apollo Client
- Symptom-based diagnosis and specialist recommendations

## Requirements
- Node.js 18 or later

## Getting Started

### Installation
Install dependencies:

```bash
npm install
```

### Environment Setup
Create a `.env` file with required configuration:

```bash
cp .env.example .env
```

The default `.env` file includes development configuration with mock data, so you can run the app without a real Supabase instance for development.

### Running the Application

Start both the backend server and frontend development server:

```bash
npm start
```

This will start:
- GraphQL API server: http://localhost:3001/graphql
- Frontend development server: http://localhost:8080

Alternatively, you can run them separately:

```bash
# Run just the GraphQL server
npm run server

# Run just the frontend
npm run dev
```

## Development

### Development Mode
The application has a development mode that uses mock data when Supabase isn't available. This is controlled by the `DEVELOPMENT_MODE=true` setting in the `.env` file. In this mode:

- Supabase queries are intercepted and return mock provider data
- GraphQL resolvers use this mock data for queries and mutations
- You can develop and test the application without a real Supabase instance

### Scripts
- `npm start` - Run both the server and frontend concurrently
- `npm run server` - Run only the GraphQL API server
- `npm run dev` - Start the Vite development server for the frontend
- `npm run build` - Build a production bundle in `dist/`
- `npm run lint` - Run ESLint on the project
- `npm run preview` - Preview the production build
- `npm test` - Run Jest tests

### Testing and Building
Before running tests or creating a production build, make sure to install the
project's dependencies:

```bash
npm install
```

This installs the local `jest` and `vite` binaries used by the `npm test` and
`npm run build` scripts.

## Architecture

The application follows a domain-driven hexagonal architecture:

- **Frontend**: React with Apollo Client for GraphQL, i18next for internationalization
- **Backend**: Express with Apollo Server for GraphQL
- **Data Layer**: Supabase (with development mode mocks for local development)

## Project Structure

```
healthcare-commons/
├── server.js                 # GraphQL API server
├── src/
│   ├── components/           # React components
│   ├── contexts/             # React context providers
│   ├── hooks/                # Custom React hooks
│   ├── lib/
│   │   ├── api.ts            # Supabase client
│   │   ├── apollo.ts         # Apollo Client setup
│   │   ├── graphql.ts        # GraphQL queries and mutations
│   │   ├── i18n.ts           # Internationalization configuration
│   │   └── diagnosisService.ts # Symptom diagnosis service
│   ├── locales/              # Translation files
│   └── pages/                # Page components
└── .env                      # Environment configuration
```

## Deploying to Production

### Deploying to Render.com

For the frontend:
1. Configure a new **Static Site** with settings:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment**: Node 18

For the backend:
1. Configure a new **Web Service** with settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Environment**: Node 18

2. Add environment variables in the Render dashboard

### Required Environment Variables for Production

```
# Supabase Configuration
VITE_SUPABASE_URL=your_real_supabase_url
VITE_SUPABASE_ANON_KEY=your_real_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_real_service_role_key

# Frontend URL for CORS
FRONTEND_URL=https://your-frontend-domain.com

# Port for the server (optional, defaults to 3001)
PORT=3001

# Set to false in production
DEVELOPMENT_MODE=false
```
