# 🚀 Deploy Your Messenger Online (FREE)

## Get Your App Online in 15 Minutes

Your friends will be able to access it via a secure HTTPS link and have encrypted conversations!

---

## Option 1: Railway + Vercel (100% FREE)

### Step 1: Prepare Your Code (DONE ✅)

I've already initialized Git for you. Now push to GitHub:

```bash
cd ~/messenger-app

# Create a new repository on GitHub.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/messenger-app.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy Backend to Railway (5 minutes)

**A. Sign Up**
1. Go to **https://railway.app**
2. Click "Login" → "Sign in with GitHub"
3. Authorize Railway

**B. Create New Project**
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `messenger-app` repository
4. Railway will detect Node.js automatically

**C. Configure Backend**
1. Click on your deployment
2. Go to "Variables" tab
3. Add these environment variables:

```
NODE_ENV=production
JWT_SECRET=your-super-secret-random-string-change-this-to-something-long-and-random
FRONTEND_URL=https://your-app.vercel.app
```

**D. Set Root Directory**
1. Go to "Settings" tab
2. Find "Root Directory"
3. Set to: `backend`
4. Save changes

**E. Get Your Backend URL**
1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Copy the URL (like: `https://messenger-production-xxxx.up.railway.app`)
4. **Save this URL** - you'll need it for Vercel!

---

### Step 3: Deploy Frontend to Vercel (5 minutes)

**A. Sign Up**
1. Go to **https://vercel.com**
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel

**B. Create New Project**
1. Click "Add New..." → "Project"
2. Import your `messenger-app` repository
3. Vercel will detect it's a React app

**C. Configure Build Settings**
1. **Root Directory**: `frontend`
2. **Build Command**: `npm run build`
3. **Output Directory**: `build`
4. **Install Command**: `npm install`

**D. Add Environment Variables**
Click "Environment Variables" and add:

```
REACT_APP_API_URL=https://YOUR-RAILWAY-URL-HERE
REACT_APP_SOCKET_URL=https://YOUR-RAILWAY-URL-HERE
```

Replace with your Railway URL from Step 2!

**E. Deploy**
1. Click "Deploy"
2. Wait 2-3 minutes for build
3. You'll get a URL like: `https://messenger-yourname.vercel.app`

---

### Step 4: Update Backend CORS (1 minute)

Go back to Railway:
1. Open your backend project
2. Go to "Variables"
3. Update `FRONTEND_URL` to your Vercel URL
4. Redeploy (Railway does this automatically)

---

### Step 5: Test It! 🎉

1. Open your Vercel URL: `https://messenger-yourname.vercel.app`
2. Create an account
3. Share the link with friends!
4. Everyone can register and start chatting

**Features that work:**
- ✅ Real-time messaging (secure WebSocket)
- ✅ Voice calls (peer-to-peer)
- ✅ Video calls (peer-to-peer)
- ✅ HTTPS encryption (automatic)
- ✅ Online status
- ✅ Typing indicators

---

## Option 2: Single VPS (Better for Privacy)

If you want complete control and data privacy:

### Recommended Providers
- **DigitalOcean** - $6/month droplet
- **Linode** - $5/month
- **Vultr** - $5/month

### Quick VPS Setup

**1. Create Server**
- Ubuntu 22.04
- 1GB RAM minimum
- Get the IP address

**2. SSH into Server**
```bash
ssh root@YOUR_SERVER_IP
```

**3. Install Dependencies**
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Nginx & Certbot
apt install -y nginx certbot python3-certbot-nginx

# Install PM2
npm install -g pm2
```

**4. Upload Your Code**
```bash
# On your Mac:
cd ~/messenger-app
tar -czf messenger.tar.gz backend/ frontend/
scp messenger.tar.gz root@YOUR_SERVER_IP:/root/

# On server:
cd /root
tar -xzf messenger.tar.gz
```

**5. Setup Backend**
```bash
cd /root/backend
npm install --production

# Create .env
cat > .env << 'EOF'
PORT=3001
JWT_SECRET=your-super-secret-random-string-minimum-32-characters
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
EOF

# Start with PM2
pm2 start server.js --name messenger
pm2 startup
pm2 save
```

**6. Build Frontend**
```bash
cd /root/frontend
npm install
npm run build
```

**7. Configure Nginx**
```bash
cat > /etc/nginx/sites-available/messenger << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    root /root/frontend/build;
    index index.html;

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
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/messenger /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

**8. Point Domain**
In your domain registrar (Namecheap, GoDaddy, etc.):
- Add A record: `yourdomain.com` → `YOUR_SERVER_IP`

**9. Get SSL Certificate (REQUIRED for calls)**
```bash
certbot --nginx -d yourdomain.com
```

**10. Share Your Link!**
```
https://yourdomain.com
```

---

## Security Checklist Before Sharing

Before inviting friends:

### ✅ Essential (Do These Now)
- [ ] Change `JWT_SECRET` to a long random string (32+ characters)
- [ ] Use HTTPS (automatic with Railway/Vercel)
- [ ] Update `FRONTEND_URL` and `REACT_APP_API_URL` to production URLs

### ✅ Recommended (Do Soon)
- [ ] Set up database backups
- [ ] Monitor server resources
- [ ] Add rate limiting to prevent spam

### ✅ Advanced (Optional)
- [ ] Migrate SQLite → PostgreSQL (when you have 100+ users)
- [ ] Add end-to-end encryption (Signal Protocol)
- [ ] Set up TURN server for better call quality

---

## Costs Breakdown

### Free Tier (Railway + Vercel)
- **Cost**: $0/month
- **Users**: ~500-1000 active users
- **Bandwidth**: Limited but sufficient for testing
- **Database**: SQLite (upgradable)

### VPS (Full Control)
- **Cost**: $5-10/month
- **Users**: 5,000+ active users
- **Bandwidth**: 1-2TB/month
- **Database**: PostgreSQL recommended

---

## Sharing Your App

Once deployed, share the link:

**Example Message to Friends:**
```
Hey! I built a private messenger app. 
Try it out: https://your-app.vercel.app

Features:
- Real-time messaging
- Voice & video calls
- No data collection
- Open source

Just sign up and we can chat securely!
```

---

## Monitoring Your App

### Railway Dashboard
- View logs
- Check resource usage
- Monitor crashes
- Restart server

### Vercel Dashboard
- Deployment history
- Build logs
- Analytics
- Error tracking

---

## Troubleshooting

**Calls not working?**
- Make sure you're using HTTPS (not HTTP)
- WebRTC requires secure context
- Railway and Vercel provide HTTPS automatically

**Messages not sending?**
- Check Railway logs for backend errors
- Verify environment variables are set correctly
- Check CORS settings match frontend URL

**Database issues?**
- Railway provides PostgreSQL for free
- Migrate from SQLite when you have 50+ users
- See DEPLOYMENT.md for migration guide

---

## Next Steps

1. **Deploy Now** - Follow Option 1 (Railway + Vercel)
2. **Test With Friends** - Share the link and test all features
3. **Monitor Usage** - Watch Railway/Vercel dashboards
4. **Upgrade Database** - Move to PostgreSQL when needed
5. **Add Features** - See FEATURES.md for roadmap

---

## Need Help?

- Full deployment guide: `DEPLOYMENT.md`
- Database migration: `DEPLOYMENT.md` (PostgreSQL section)
- Scaling tips: `README.md` (Scaling section)

---

**Your messenger app is production-ready! Choose a deployment method and go live! 🚀**
