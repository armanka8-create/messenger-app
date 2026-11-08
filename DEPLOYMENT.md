# 🌐 Production Deployment Guide

Deploy your messenger app to the internet so real users can access it from anywhere.

## Overview

You need to deploy:
1. **Backend** - Node.js server (handles messages, calls, database)
2. **Frontend** - React app (the user interface)
3. **Domain** (optional but recommended)
4. **SSL Certificate** (required for calls to work)

## Recommended Approach: Railway + Vercel (Free Tier)

This setup is **100% free** to start and handles everything automatically.

### Part 1: Deploy Backend to Railway

Railway gives you a free server that runs 24/7.

1. **Sign up at [Railway.app](https://railway.app)**
   - Use GitHub login (free)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - **Important**: Push ONLY the `backend` folder to a GitHub repo

3. **Configure Backend**
   - Railway will auto-detect Node.js
   - Add environment variables:
     ```
     JWT_SECRET=your-super-secret-random-string-here-at-least-32-characters
     NODE_ENV=production
     FRONTEND_URL=https://your-app.vercel.app
     ```
   - Railway assigns a URL like: `https://your-app.railway.app`

4. **Get Your Backend URL**
   - Copy the URL Railway gives you (e.g., `https://messenger-production.up.railway.app`)

### Part 2: Deploy Frontend to Vercel

Vercel hosts React apps for free with automatic SSL.

1. **Sign up at [Vercel.com](https://vercel.com)**
   - Use GitHub login (free)

2. **Create New Project**
   - Click "Add New" → "Project"
   - Import the `frontend` folder from GitHub
   - Vercel auto-detects React

3. **Configure Environment Variables**
   - In Vercel project settings → Environment Variables:
     ```
     REACT_APP_API_URL=https://your-backend.railway.app
     REACT_APP_SOCKET_URL=https://your-backend.railway.app
     ```
   - Use the Railway URL from Part 1

4. **Deploy**
   - Click "Deploy"
   - Vercel builds and deploys automatically
   - You get a URL like: `https://messenger-your-name.vercel.app`

5. **Update Backend**
   - Go back to Railway
   - Update `FRONTEND_URL` to your Vercel URL
   - Redeploy

### Part 3: Custom Domain (Optional)

**For Vercel (Frontend):**
1. Buy domain at Namecheap, GoDaddy, etc.
2. In Vercel: Settings → Domains → Add domain
3. Follow DNS instructions
4. Get free SSL automatically

**For Railway (Backend):**
1. Settings → Domains → Add custom domain
2. Point your domain/subdomain to Railway
3. SSL is automatic

---

## Alternative: Deploy Everything on One VPS

For full control, deploy to a single Linux server.

### Recommended Providers
- **DigitalOcean** - $6/month droplet
- **Linode** - $5/month
- **Vultr** - $5/month
- **AWS Lightsail** - $3.50/month

### Setup Steps

#### 1. Create Server
- Ubuntu 22.04 LTS
- 1GB RAM minimum
- Create server and SSH in

#### 2. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### 3. Upload Your Code
```bash
# On your local machine
cd messenger-app
tar -czf messenger-app.tar.gz backend/ frontend/

# Upload to server (replace YOUR_SERVER_IP)
scp messenger-app.tar.gz root@YOUR_SERVER_IP:/root/

# On server
cd /root
tar -xzf messenger-app.tar.gz
```

#### 4. Setup Backend
```bash
cd /root/backend

# Install dependencies
npm install --production

# Create .env file
nano .env
```

Add to `.env`:
```
PORT=3001
JWT_SECRET=your-super-long-random-secret-key-minimum-32-characters
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

```bash
# Start with PM2
pm2 start server.js --name messenger-backend
pm2 startup
pm2 save
```

#### 5. Build Frontend
```bash
cd /root/frontend

# Install dependencies
npm install

# Build production version
npm run build
```

This creates `/root/frontend/build` folder with optimized files.

#### 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/messenger
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve React frontend
    root /root/frontend/build;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/messenger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Point Domain to Server

In your domain registrar (Namecheap, GoDaddy, etc.):
- Create **A record**: `yourdomain.com` → `YOUR_SERVER_IP`
- Create **A record**: `www.yourdomain.com` → `YOUR_SERVER_IP`

Wait 5-30 minutes for DNS to propagate.

#### 8. Get SSL Certificate (Required!)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow prompts:
- Enter email
- Agree to terms
- Choose "Redirect HTTP to HTTPS"

Certbot auto-renews every 90 days!

#### 9. Update Frontend Config

Your frontend must point to your domain:

```bash
cd /root/frontend
nano .env
```

Change to:
```
REACT_APP_API_URL=https://yourdomain.com
REACT_APP_SOCKET_URL=https://yourdomain.com
```

Rebuild:
```bash
npm run build
```

### Done! 🎉

Visit `https://yourdomain.com` - your messenger is live!

---

## Database Upgrade: SQLite → PostgreSQL

When you have 100+ active users, upgrade to PostgreSQL.

### On Your Server

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE messenger;
CREATE USER messenger_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE messenger TO messenger_user;
\q
```

### Update Backend

```bash
cd /root/backend

# Replace better-sqlite3 with pg
npm uninstall better-sqlite3
npm install pg

# Update database.js to use PostgreSQL
# (You'll need to rewrite queries from SQLite to Postgres syntax)
```

Example PostgreSQL connection:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'messenger_user',
  host: 'localhost',
  database: 'messenger',
  password: 'your_secure_password',
  port: 5432,
});
```

---

## Scaling for Heavy Traffic

### Add TURN Server (Better Calls)

For users behind strict firewalls/NAT:

```bash
sudo apt install coturn

# Configure coturn
sudo nano /etc/turnserver.conf
```

Add:
```
listening-ip=YOUR_SERVER_IP
external-ip=YOUR_SERVER_IP
realm=yourdomain.com
server-name=yourdomain.com
user=username:password
```

Update frontend WebRTC config:
```javascript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { 
    urls: 'turn:yourdomain.com:3478',
    username: 'username',
    credential: 'password'
  }
]
```

### Redis for Multiple Servers

When one server isn't enough:

```bash
sudo apt install redis-server

# In backend/package.json add:
npm install socket.io-redis
```

Update `server.js`:
```javascript
const { createAdapter } = require('socket.io-redis');
const redis = require('redis');

const pubClient = redis.createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

Now you can run multiple backend instances behind a load balancer!

---

## Monitoring & Maintenance

### Check Backend Status
```bash
pm2 status
pm2 logs messenger-backend
```

### Restart Backend
```bash
pm2 restart messenger-backend
```

### Database Backup
```bash
# SQLite
cp /root/backend/messenger.db /root/backups/messenger-$(date +%Y%m%d).db

# PostgreSQL
pg_dump messenger > /root/backups/messenger-$(date +%Y%m%d).sql
```

### Update Code
```bash
cd /root/backend
git pull  # or upload new files
npm install
pm2 restart messenger-backend

cd /root/frontend
git pull
npm install
npm run build
```

---

## Troubleshooting

**Nginx error "502 Bad Gateway"**
- Backend not running: `pm2 status`
- Check backend logs: `pm2 logs messenger-backend`

**Calls not connecting**
- SSL not installed (WebRTC requires HTTPS)
- Firewall blocking ports: `sudo ufw allow 80,443/tcp`

**Database locked**
- SQLite doesn't handle many concurrent users
- Upgrade to PostgreSQL

**Out of memory**
- Upgrade server RAM
- Or use separate servers for frontend/backend

---

## Cost Breakdown

### Free Tier (Railway + Vercel)
- **Cost**: $0/month
- **Good for**: Up to ~1000 users
- **Limitations**: Limited bandwidth, shared resources

### Single VPS
- **Cost**: $5-10/month
- **Good for**: Up to ~5000 users
- **Provider**: DigitalOcean, Linode, Vultr

### Scalable Production
- **Cost**: $50-200/month
- **Good for**: 10,000+ users
- **Setup**: Load balancer + 2-3 app servers + PostgreSQL + Redis + TURN server

---

**Questions? Check the main [README.md](README.md) or open an issue on GitHub!**
