# Custom Tenant Management Portal

This project is a Vite + React + TypeScript single-page application.

## Local development

```bash
npm ci
npm run build
```

The production output is generated in `dist/`.

## GitHub setup

Run these commands from the project folder after creating an empty GitHub repository:

```bash
git init
git branch -M main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

If you prefer SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Ubuntu server deployment

These commands assume:

- Ubuntu 22.04 or 24.04
- a domain such as `portal.example.com`
- Nginx will serve the site
- the app will live at `/var/www/custom-tenant-management-portal`

### 1. Install system packages

```bash
sudo apt update
sudo apt install -y nginx curl git
```

### 2. Install Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 3. Clone the repository onto the server

```bash
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git custom-tenant-management-portal
sudo chown -R $USER:$USER /var/www/custom-tenant-management-portal
cd /var/www/custom-tenant-management-portal
```

If using SSH:

```bash
cd /var/www
sudo git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git custom-tenant-management-portal
sudo chown -R $USER:$USER /var/www/custom-tenant-management-portal
cd /var/www/custom-tenant-management-portal
```

### 4. Install dependencies and build

```bash
npm ci
npm run build
```

### 5. Configure Nginx

Create the site config:

```bash
sudo nano /etc/nginx/sites-available/custom-tenant-management-portal
```

Paste this configuration and replace `portal.example.com` with your real domain or server name:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name portal.example.com;

    root /var/www/custom-tenant-management-portal/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|webp)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        try_files $uri =404;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/custom-tenant-management-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

If the default site conflicts, remove it:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Add HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d portal.example.com
```

### 7. Updating the app after future changes

```bash
cd /var/www/custom-tenant-management-portal
git pull origin main
npm ci
npm run build
sudo systemctl reload nginx
```

## Notes for this project

- The app currently builds as a static frontend and does not require a Node server process in production.
- Routing uses `BrowserRouter`, so the Nginx `try_files $uri $uri/ /index.html;` rule is required.
- The service layer is currently mock-based, so no production API environment variables are required yet.
