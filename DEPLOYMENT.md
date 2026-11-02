# Archer — Deployment Plan

Single-server deployment of the Archer marketplace on a DigitalOcean Droplet, deployed from GitHub with `gh` + `doctl`. Budget: under $50/month.

> **Scope note:** This is a plan only — no setup has been executed. Commands below are the steps to run when you carry it out.

## Adjustments from the original draft

These changes were necessary to match the actual codebase:

1. **SQLite, not Postgres.** The API uses Prisma 7 with the `better-sqlite3` adapter and a SQLite datasource. Switching to Postgres would require schema, datasource, and driver changes. The plan deploys the existing SQLite database file as-is. (Revisit Postgres only if you later need multiple API instances or managed backups.)
2. **Mobile app is not deployed to the VPS.** `mobile/` is an Expo client (runs via Expo Go / EAS); only `app/` (static) and `api/` (Node) go to the server.
3. **Same-origin proxy instead of cross-origin API.** Nginx serves the built web app and proxies `/api/` to the API on `127.0.0.1:5001`. With `VITE_API_URL` left empty, the web client calls same-origin `/api/v1/...` — no CORS friction from the IP-only setup.
4. **Production migrations use `prisma migrate deploy`**, not `migrate dev` (which is interactive and unsafe on a server).
5. **Added:** firewall, PM2 persistence, SQLite backup, health-check routing, rollback, and security steps that the draft implied but did not spell out.

## Tools

| Tool | Purpose |
|---|---|
| GitHub CLI (`gh`) | Create private repo, push code, manage repo secrets |
| DigitalOcean CLI (`doctl`) | Create/authenticate the Droplet, manage firewall, snapshots |
| `ssh` / `scp` | Server access and file transfer |
| PM2 | Keep the API process alive and restart on crash/reboot |
| Nginx | Serve static web build, reverse-proxy the API |

## Budget (under $50)

| Item | Cost |
|---|---|
| Droplet — Basic, 1 vCPU/1 GB, 25 GB SSD (`s-1vcpu-1gb`) | $6/mo |
| Droplet alternative if it feels tight — `s-1vcpu-2gb` | $12/mo |
| Domain name | $0 (deferred) |
| HTTPS (Let's Encrypt) | $0 (deferred; requires domain) |
| **Total** | **$6–12/mo** |

The demo workload (250 seeded projects, single API instance) fits comfortably in 1 GB. Start at $6/mo; upgrade only if memory pressure appears in PM2/Nginx logs.

## Setup — single Droplet

```
Internet ──> Droplet (Ubuntu 24.04)
              ├── Nginx :80
              │     ├── static web build (app/dist)   ← SPA, serves / and /projects/...
              │     └── proxy /api/  ──> 127.0.0.1:5001 (Express API via PM2)
              ├── API (PM2, node dist/src/server.js, port 5001, bound to localhost)
              ├── SQLite file (api/prisma/dev.db)
              └── UFW firewall: 22 (SSH), 80 (HTTP)
```

- **Frontend:** `app/` built with Vite → static files served by Nginx (SPA fallback to `index.html`).
- **API:** `api/` compiled with `tsc` → run under PM2 → Nginx proxies `/api/` to it.
- **Ports:** public 80 (and later 443). API port 5001 stays closed to the internet (localhost-only proxy).

## Defer (intentionally out of scope for now)

- **Domain name** — deploy by Droplet IP only (`http://<DROPLET_IP>`).
- **HTTPS (Let's Encrypt)** — cannot be issued for a bare IP, so it must wait for the domain. When the domain arrives: point DNS A record at the Droplet, run Certbot, add 443 + redirect 80→443, and set `CORS_ORIGIN`/origin checks to `https://<domain>`.
- **CDN, load balancing, managed DB, auto-scaling** — single droplet is sufficient.

> **Known risk of IP-only HTTP:** tokens live in `localStorage` and travel unencrypted. Acceptable for a demo/low-stakes environment; move to HTTPS as the first post-MVP task.

---

## Step 1 — One-time server setup

Run once per server. Order matters.

### 1.1 Authenticate the CLIs (local machine)

```bash
gh auth status                 # must be logged in
doctl auth init                # paste DigitalOcean token
```

### 1.2 Create the Droplet

```bash
doctl compute droplet create archer-prod \
  --region nyc3 --size s-1vcpu-1gb --image ubuntu-24-04-x64 \
  --ssh-keys <YOUR_SSH_KEY_ID> --tag-name archer --wait
```

Record the returned IP. Optional but recommended — a firewall:

```bash
doctl compute firewall create \
  --name archer-fw --inbound-rules 'tcp:22:0.0.0.0/0,tcp:80:0.0.0.0/0' \
  --droplet-ids <DROPLET_ID>
```

### 1.3 Create the private GitHub repository and push

```bash
gh repo create archer --private --source . --push
```

(Exclude secrets: `api/.env`, `api/prisma/dev.db`, `node_modules/` must remain gitignored — verify `.gitignore` before the first push.)

### 1.4 Base server packages (SSH in as root)

```bash
apt update && apt upgrade -y
apt install -y nginx git curl ufw
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs
npm install -g pm2
ufw allow 22/tcp && ufw allow 80/tcp && ufw enable
```

Node 24 matches `api/.nvmrc` / `app/.nvmrc` and Prisma 7's support window.

### 1.5 Clone and install

```bash
git clone git@github.com:<you>/archer.git /var/www/archer
cd /var/www/archer
npm --prefix api ci
npm --prefix app ci
```

### 1.6 Server environment file (never committed)

```bash
cp api/.env.example api/.env
```

Then edit `api/.env` on the server:

```bash
NODE_ENV=production
PORT=5001
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET="<generate: openssl rand -hex 32>"   # >= 32 chars, unique per env
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_DAYS=30
CORS_ORIGIN="http://<DROPLET_IP>"
```

Web/app: leave `app/.env` absent or `VITE_API_URL=` empty (same-origin proxy). Do not set `VITE_API_URL` to the IP — the Nginx `/api/` proxy makes it unnecessary.

### 1.7 Database migrate, generate, seed

```bash
cd /var/www/archer/api
npx prisma generate
npx prisma migrate deploy        # applies committed migrations — production-safe
npm run db:seed                  # demo data only; skip for a non-demo launch
```

### 1.8 Build both projects

```bash
npm --prefix /var/www/archer/api run build     # tsc -> api/dist
npm --prefix /var/www/archer/app run build     # vite -> app/dist
```

### 1.9 Start the API under PM2

```bash
cd /var/www/archer/api
pm2 start dist/src/server.js --name archer-api
pm2 save
pm2 startup systemd -u root --hp /root   # follow the printed command, then run it
```

Verify locally on the droplet:

```bash
curl -s localhost:5001/health     # expect ok
curl -s localhost:5001/ready      # expect DB ok
```

### 1.10 Nginx site config

`/etc/nginx/sites-available/archer`:

```nginx
server {
    listen 80 default_server;
    server_name _;

    root /var/www/archer/app/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API reverse proxy (same-origin for the web client)
    location /api/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Request-Id $request_id;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API health endpoints live at the API root, not under /api/v1 —
    # expose them for uptime checks without colliding with the SPA.
    location = /health {
        proxy_pass http://127.0.0.1:5001/health;
    }
    location = /ready {
        proxy_pass http://127.0.0.1:5001/ready;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/archer /etc/nginx/sites-enabled/archer
nginx -t && systemctl reload nginx
```

> Without the `/health` and `/ready` locations above, those URLs would be swallowed by the SPA fallback.

### 1.11 Acceptance checklist (Step 1 done when all pass)

- [ ] `http://<DROPLET_IP>/` loads the landing page
- [ ] `http://<DROPLET_IP>/projects` lists seeded projects (API reachable through the proxy)
- [ ] `http://<DROPLET_IP>/health` and `/ready` return OK from outside
- [ ] Register + sign-in work end to end on the deployed site
- [ ] `curl -s <DROPLET_IP>:5001/health` from your machine **fails** (port 5001 not exposed)
- [ ] `pm2 list` shows `archer-api` online; `pm2 save` + startup registered

---

## Step 2 — Ongoing deployment (push → deploy)

Every change ships by pushing to GitHub and letting the server pick it up.

### 2.1 Recommended: GitHub Actions → SSH deploy

A workflow (`.github/workflows/deploy.yml`, added later as part of implementation) that on push to `main`:

1. Checks out the repo.
2. Connects to the Droplet over SSH using repository secrets (`HOST`, `SSH_KEY`, `USER`).
3. Runs the deploy script below.

No server-side GitHub credentials needed; secrets live in GitHub.

### 2.2 The deploy script (runs on the Droplet)

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /var/www/archer

git fetch origin main
git reset --hard origin/main

npm --prefix api ci
npm --prefix app ci

(cd api && npx prisma generate && npx prisma migrate deploy)
npm --prefix api run build
npm --prefix app run build

pm2 reload archer-api --update-env
```

Key properties:

- **`git reset --hard`** keeps the server exactly on `origin/main` (no manual drift).
- **`migrate deploy`** applies only committed migrations; never `migrate dev` or `db:seed` on a schedule (seed is one-time/optional).
- **`pm2 reload`** does a zero-downtime-ish restart of the API.
- Static files swap instantly on the next request; no Nginx reload needed.

### 2.3 Manual fallback (no CI yet)

```bash
ssh root@<DROPLET_IP> 'bash /var/www/archer/deploy.sh'
```

### 2.4 Deployment flow summary

```
developer: git push origin main
   └── GitHub Actions (or manual ssh)
         └── droplet: pull → install → migrate → build → pm2 reload
               ├── app/dist  served by Nginx
               └── api/dist  reloaded by PM2
```

---

## Operations & safety

### Backups (SQLite)

The database is a single file (`api/prisma/dev.db`). Nightly cron on the droplet:

```bash
cp /var/www/archer/api/prisma/dev.db "/backup/archer-$(date +%F).db"
```

Keep at least 7 rolling copies; optionally `doctl` take a Droplet snapshot weekly (snapshots bill on storage, still within budget at this size).

### Rollback

```bash
ssh root@<DROPLET_IP>
cd /var/www/archer
git log --oneline -5              # find last good commit
git reset --hard <GOOD_SHA>
npm --prefix api ci && npm --prefix app ci
(cd api && npx prisma generate)
npm --prefix api run build && npm --prefix app run build
pm2 reload archer-api
```

For a broken migration, restore the latest `/backup/*.db` first, then roll back the code.

### Monitoring (minimal, $0)

- Uptime: any free checker against `http://<DROPLET_IP>/health` and `/ready`.
- Process: `pm2 monit` / `pm2 logs archer-api`.
- Disk: `df -h` — SQLite and npm caches are the usual growers.
- Later: add Nginx access/error log rotation (`logrotate`).

### Security baseline (IP-only HTTP phase)

- SSH: key-only auth; consider changing port or `ufw limit 22/tcp` against brute force.
- `api/.env` and `dev.db` stay off git; generated `JWT_ACCESS_SECRET` is unique and never shared.
- Keep ports 5001/5432/anything-but-80 firewalled; the API is reachable only through the Nginx proxy.
- Run `npm audit` in `api/` and `app/` as part of CI once added.
- When the domain arrives: Certbot + 443 + HTTP→HTTPS redirect + HSTS, and update `CORS_ORIGIN`.

## Out of scope for this plan

- Domain purchase and DNS, HTTPS issuance (deferred — see above).
- Mobile app distribution (Expo EAS builds / store submission — separate pipeline).
- Postgres migration, managed databases, load balancing, staging environment.
- Payment/finance infrastructure (not part of the MVP by design).

## Reference — ports, processes, paths

| Concern | Value |
|---|---|
| Public HTTP | Nginx :80 |
| Web build output | `/var/www/archer/app/dist` |
| API process | PM2 `archer-api` → `node dist/src/server.js` on `127.0.0.1:5001` |
| Database | SQLite at `api/prisma/dev.db` (backed up to `/backup/`) |
| API env file (server only) | `api/.env` (`NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `CORS_ORIGIN`, TTLs) |
| Web API base URL | `VITE_API_URL` empty → same-origin `/api/v1` via Nginx |
| Repo | private GitHub repo, `main` branch is the deploy source |
