# 🚀 Quick Start Guide

Get your messenger app running in **3 minutes**!

## Step 1: Install Dependencies

Open two terminal windows.

### Terminal 1 - Backend
```bash
cd messenger-app/backend
npm install
```

### Terminal 2 - Frontend  
```bash
cd messenger-app/frontend
npm install
```

## Step 2: Start the Servers

### Terminal 1 - Start Backend
```bash
cd messenger-app/backend
npm start
```

You should see:
```
🚀 Messenger server running on port 3001
📱 Frontend URL: http://localhost:3000
```

### Terminal 2 - Start Frontend
```bash
cd messenger-app/frontend
npm start
```

Your browser will open automatically at `http://localhost:3000`

## Step 3: Create Your First Users

### Create User 1
1. Click **"Sign Up"**
2. Enter:
   - Display Name: `Alice`
   - Username: `alice`
   - Password: `test123`
3. Click **Sign Up**

### Create User 2  
1. **Logout** (click Logout button)
2. Click **"Sign Up"** again
3. Enter:
   - Display Name: `Bob`  
   - Username: `bob`
   - Password: `test123`
4. Click **Sign Up**

## Step 4: Start Chatting!

- Click on **Alice** in the sidebar
- Type a message and press **Enter**
- The message appears instantly!

## Testing Real-Time Features

### Test with Two Browser Windows

**Option A: Same Computer (Easy)**
1. Regular window: Login as `alice`
2. Incognito/Private window: Login as `bob`
3. Position windows side-by-side
4. Chat between them in real-time!

**Option B: Two Devices**
1. Device 1: Login as `alice` at `http://localhost:3000`
2. Device 2: Login as `bob` at `http://YOUR-IP:3000`
3. Chat from different devices!

### Test Voice/Video Calls

1. In one window (as Alice), click **📞** or **📹** 
2. In other window (as Bob), you'll see "Incoming call"
3. Click **Answer**
4. You're now in a live call!

> **Note**: First call will ask for camera/microphone permission - click **Allow**

## Easy Start Script

Instead of opening two terminals, use the start script:

### macOS/Linux
```bash
cd messenger-app
./start.sh
```

### Windows
```bash
cd messenger-app
start.bat
```

This starts both servers automatically!

## Troubleshooting

**Port already in use?**
```bash
# Kill processes on ports 3000 or 3001
lsof -ti:3000 | xargs kill
lsof -ti:3001 | xargs kill
```

**Dependencies failed?**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Camera/Mic not working?**
- Check browser permissions (click 🔒 in address bar)
- Try Chrome or Firefox (Safari can be tricky)
- Must use localhost or HTTPS for WebRTC

## What's Next?

- **Deploy it**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Customize it**: Edit CSS files for your branding
- **Add features**: Check README.md for enhancement ideas

---

**Ready to deploy for real users?** → See [DEPLOYMENT.md](DEPLOYMENT.md)
