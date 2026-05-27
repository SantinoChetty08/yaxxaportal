# Yaxxa Portal Deployment Guide

This portal now has two parts:

- a React/Vite frontend in `src/`
- a production backend in `server/` for:
  - sign-in and session handling
  - portal user management
  - live tenant, user, campaign, and DID reads from MariaDB

## Architecture

Production setup should look like this:

1. Browser loads the built frontend from Nginx.
2. Frontend calls `/api/*`.
3. Nginx proxies `/api/*` to the Node backend.
4. Node backend connects to MariaDB.
5. Portal usernames and password hashes live in `portal_users`.

The browser should never connect directly to MariaDB in production.

## What Gets Stored

Portal access is stored in MariaDB using:

- `portal_users`
- `portal_sessions`

Passwords are not stored in plain text. The backend hashes them with `scrypt`.

SQL to create the auth tables is in:

- [deployment/sql/001_portal_auth.sql](/C:/Users/SantinoChetty/Downloads/santinoflowbotv1-main/custom-tenant-management-portal/deployment/sql/001_portal_auth.sql)

## Environment Variables

Use [.env.example](/C:/Users/SantinoChetty/Downloads/santinoflowbotv1-main/custom-tenant-management-portal/.env.example) as the template.

Important production values:

- `VITE_PORTAL_DATA_SOURCE=backend`
- `VITE_PORTAL_AUTH_MODE=backend`
- `PORTAL_API_PORT=8787`
- `PORTAL_APP_ORIGIN=https://your-portal-domain`
- `PORTAL_SESSION_SECRET=<long-random-secret>`
- `PORTAL_DB_HOST=<live-telecom-db-or-replica>`
- `PORTAL_DB_USER=<read-user>`
- `PORTAL_DB_PASSWORD=<read-password>`
- `PORTAL_DB_NAME=hoducc`
- `PORTAL_AUTH_DB_HOST=<writable-db-host>`
- `PORTAL_AUTH_DB_USER=<write-user>`
- `PORTAL_AUTH_DB_PASSWORD=<write-password>`
- `PORTAL_AUTH_DB_NAME=<portal-auth-db>`

Recommended split:

- `PORTAL_DB_*` points to the telecom data source used for reads.
- `PORTAL_AUTH_DB_*` points to a writable DB/schema for portal access control.

## Local Development

Run frontend and backend together:

```bash
npm ci
npm run dev:full
```

Or run them separately:

```bash
npm run dev:api
npm run dev
```

## First-Time Database Setup

1. Run the SQL migration in `deployment/sql/001_portal_auth.sql`.
2. Create the first admin user:

```bash
npm run seed:admin
```

## Production Build

Build the frontend:

```bash
npm ci
npm run build
```

Start the backend:

```bash
npm run start:api
```

## Nginx Example

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name portal.example.com;

    root /var/www/yaxxaportal/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8787/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Systemd Service

Use:

- [deployment/systemd/yaxxa-portal-api.service](/C:/Users/SantinoChetty/Downloads/santinoflowbotv1-main/custom-tenant-management-portal/deployment/systemd/yaxxa-portal-api.service)

Typical flow:

```bash
sudo cp deployment/systemd/yaxxa-portal-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable yaxxa-portal-api
sudo systemctl start yaxxa-portal-api
sudo systemctl status yaxxa-portal-api
```

## Recommended Hosting Pattern

Best internal production setup:

1. Ubuntu VM or internal container host
2. Nginx in front
3. Node backend as a systemd service
4. MariaDB auth tables on a writable DB
5. Telecom tenant data from a read-optimized DB user
6. HTTPS and VPN/internal network restriction

## Current Limits

This backend is production-ready for:

- portal sign-in
- session-based auth
- portal admin user CRUD
- live read access to tenants, users, campaigns, and DIDs

These parts are still intentionally read-only:

- tenant create/update/suspend against HoduCC
- DID assignment/release/quarantine against the live telecom platform

To make those writable, the next step is to connect the backend to the real HoduCC/Yaxxa admin write APIs or a safe writable service layer.
