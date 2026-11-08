# 🗨️ Real-Time Messenger App

A full-featured messaging application with real-time text chat and WebRTC voice/video calling, similar to Telegram, Signal, and Viber.

## ✨ Features

- **User Authentication** - Secure registration and login with JWT
- **Real-time Messaging** - Instant 1-on-1 text chat using WebSocket (Socket.io)
- **Voice & Video Calls** - Peer-to-peer WebRTC calling with no third-party services
- **Online Status** - Live presence indicators showing who's online
- **Typing Indicators** - See when someone is typing
- **Read Receipts** - Know when messages have been read
- **Message History** - All conversations saved to database
- **Responsive Design** - Clean, modern UI that works on all screen sizes

## 🏗️ Architecture

### Backend
- **Node.js + Express** - REST API server
- **Socket.io** - Real-time WebSocket communication
- **SQLite** - Lightweight database (upgradeable to PostgreSQL)
- **bcrypt** - Password hashing
- **JWT** - Secure authentication tokens

### Frontend
- **React** - Modern UI framework
- **WebRTC** - Peer-to-peer video/voice calling
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP requests

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. **Clone/Navigate to the project**
```bash
cd messenger-app
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
cp .env.example .env
```

3. **Edit Backend Environment** (optional)
```bash
# Edit backend/.env if needed
# Default settings work for local development
```

4. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

### Running the App

1. **Start the Backend Server** (in `backend/` directory)
```bash
npm start
```
Server will run on http://localhost:3001

2. **Start the Frontend** (in new terminal, in `frontend/` directory)
```bash
npm start
```
App will open at http://localhost:3000

### Creating Test Users

1. Open http://localhost:3000
2. Click "Sign Up"
3. Create first user (e.g., username: `alice`, password: `password123`)
4. Logout and create second user (e.g., username: `bob`, password: `password123`)
5. Login as Alice and start chatting with Bob!

**Pro tip**: Open two browser windows (one regular, one incognito) to test real-time chat between two users.

## 📱 How to Use

### Messaging
- Select a user from the sidebar to start chatting
- Type your message and press Enter or click Send
- Messages appear instantly on both sides
- Green dot = user is online

### Making Calls
- Click 📞 for voice call or 📹 for video call
- Recipient gets incoming call notification
- Accept to start the call
- Click "End Call" to disconnect

### First-time Camera/Mic Permission
When you make your first call, your browser will ask for camera/microphone permission - click Allow.

## 🌐 Production Deployment

### Option 1: Deploy to Any VPS (DigitalOcean, Linode, AWS EC2, etc.)

1. **Server Requirements**
   - Ubuntu 20.04+ or similar Linux
   - 1GB RAM minimum
   - Node.js 16+
   - Domain name (optional but recommended)

2. **Setup Server**
```bash
# On your server
sudo apt update
sudo apt install -y nodejs npm nginx

# Clone your app
cd /var/www
git clone <your-repo-url> messenger-app
cd messenger-app
```

3. **Configure Backend**
```bash
cd backend
npm install --production
cp .env.example .env
nano .env  # Edit production settings
```

Set in `.env`:
```
PORT=3001
JWT_SECRET=<generate-random-secure-string-here>
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

4. **Build Frontend**
```bash
cd ../frontend
npm install
npm run build
```

5. **Setup PM2 (Process Manager)**
```bash
sudo npm install -g pm2
cd ../backend
pm2 start server.js --name messenger-backend
pm2 startup  # Enable auto-start on reboot
pm2 save
```

6. **Setup Nginx**
```nginx
# /etc/nginx/sites-available/messenger
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (React build)
    location / {
        root /var/www/messenger-app/frontend/build;
        try_files $uri /index.html;
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

    # Socket.io
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

```bash
sudo ln -s /etc/nginx/sites-available/messenger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **SSL Certificate (Recommended for Production)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Option 2: Deploy Frontend to Netlify/Vercel (Free)

1. **Deploy Frontend**
   - Push code to GitHub
   - Connect to Netlify/Vercel
   - Set build command: `npm run build`
   - Set publish directory: `build`
   - Add environment variable: `REACT_APP_API_URL=https://your-backend.com`

2. **Deploy Backend to Railway/Render (Free tier)**
   - Push backend folder to separate GitHub repo
   - Connect to Railway.app or Render.com
   - Set environment variables from `.env`
   - Auto-deploys on git push

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `JWT_SECRET` | Secret key for JWT tokens | (change in production!) |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:3001` |
| `REACT_APP_SOCKET_URL` | Socket.io server URL | `http://localhost:3001` |

## 📊 Database

Currently uses **SQLite** (`backend/messenger.db`) for simplicity. For production with many users, migrate to PostgreSQL:

1. Install PostgreSQL
2. Replace `better-sqlite3` with `pg` package
3. Update `database.js` to use PostgreSQL connection

## 🔒 Security Notes

- **Change JWT_SECRET** in production to a long random string
- Use **HTTPS** for production (SSL certificate)
- Implement **rate limiting** for API endpoints (e.g., using `express-rate-limit`)
- Add **input validation** for user inputs
- Consider **end-to-end encryption** for messages (Signal Protocol)

## 🌟 Scaling Considerations

For production with many users:

1. **Database**: Migrate SQLite → PostgreSQL
2. **Horizontal Scaling**: Use Redis for Socket.io adapter (multi-server)
3. **Media Server**: Add TURN server for WebRTC NAT traversal (coturn)
4. **CDN**: Serve static files via CloudFlare/CloudFront
5. **Monitoring**: Add logging (Winston) and monitoring (PM2, New Relic)

## 🛠️ Troubleshooting

**Camera/Mic not working?**
- Check browser permissions
- Must use HTTPS in production (WebRTC requires secure context)
- Try different browser (Chrome/Firefox recommended)

**Messages not sending?**
- Check backend is running (`http://localhost:3001` should show API message)
- Check browser console for errors
- Verify Socket.io connection in Network tab

**Users can't connect?**
- Verify CORS settings match frontend URL
- Check firewall allows port 3001
- Ensure Socket.io endpoint is accessible

## 📝 API Documentation

### Authentication

**POST /api/auth/register**
```json
{
  "username": "alice",
  "password": "password123",
  "displayName": "Alice Smith"
}
```

**POST /api/auth/login**
```json
{
  "username": "alice",
  "password": "password123"
}
```

### Users & Messages

**GET /api/users** - Get all users (requires auth token)

**GET /api/messages/:userId** - Get message history with user

All authenticated requests need header:
```
Authorization: Bearer <jwt-token>
```

## 🎨 Customization

- **Colors**: Edit CSS files in `frontend/src/components/*.css`
- **Logo**: Replace emoji in `Auth.jsx` with `<img>` tag
- **Themes**: Add dark mode by creating alternate CSS classes
- **Languages**: Add i18n library for multi-language support

## 📦 Project Structure

```
messenger-app/
├── backend/
│   ├── server.js          # Main server & Socket.io
│   ├── database.js        # Database operations
│   ├── auth.js            # JWT authentication
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx   # Login/Register
│   │   │   └── Chat.jsx   # Main chat UI
│   │   ├── App.jsx        # Root component
│   │   ├── api.js         # REST API calls
│   │   └── socket.js      # Socket.io setup
│   └── package.json
└── README.md
```

## 🤝 Contributing

This is an MVP. To enhance:
- Group chats
- File/image sharing
- Push notifications
- Message search
- User profiles & avatars
- Status updates
- Message encryption

## 📄 License

MIT - Free to use and modify

## 🆘 Support

For issues:
1. Check browser console for errors
2. Verify both backend and frontend are running
3. Check ports 3000 and 3001 are not in use
4. Try clearing browser cache and localStorage

---

**Built with ❤️ using React, Node.js, Socket.io, and WebRTC**
