# Archer web app

The web-only Archer frontend is an independent React/Vite project. It uses React Router for navigation, TanStack React Query for API state, and shadcn-compatible UI configuration.

## Run locally

Start the API in one terminal:

```bash
cd /Users/hteinlynnaung/Downloads/Freelance/api
npm run dev
```

Start the website in a second terminal:

```bash
cd /Users/hteinlynnaung/Downloads/Freelance/app
npm install
npm run dev
```

Open [http://localhost:5000](http://localhost:5000). During local development, Vite forwards `/api` requests to the API at `http://localhost:5001`.

If the API is running on another URL, create `app/.env` from `.env.example` and set `VITE_API_URL`.

## Demo sign-in

- Email: `client1@archer.local`
- Password: `ArcherDemo123!`

## Verify a production build

```bash
npm run typecheck
npm run build
```
