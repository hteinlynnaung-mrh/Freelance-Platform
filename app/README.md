# Archer web app

The Archer website is an independent React/Vite project. It uses React Router for navigation, TanStack React Query for API state, and shadcn-compatible UI primitives. The API runs independently from ../api.

## Run locally

Start the API in one terminal from the repository root:

    npm --prefix api run dev

Start the website in a second terminal from the repository root:

    npm --prefix app install
    npm --prefix app run dev

Open http://localhost:5000. During local development, Vite forwards /api requests to the API at http://localhost:5001.

If the API is running on another URL, create app/.env from .env.example and set VITE_API_URL. Leave it empty for the local Vite proxy.

## Main routes

- / — landing page
- /projects — project discovery
- /projects/:id — project detail
- /login — sign in
- /register — registration

## Demo sign-in

- Email: client1@archer.local
- Password: ArcherDemo123!

## Verify a production build

    npm run typecheck
    npm run build

The web app supports English/Japanese, persisted light/dark mode, USD/JPY filtering and formatting, saved projects for authenticated users, and an authenticated navbar account/sign-out state.
