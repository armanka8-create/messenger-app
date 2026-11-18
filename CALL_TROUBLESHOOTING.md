# 🎥 Troubleshooting Voice/Video Calls

## Common Issues & Fixes

### Issue 1: Browser Permissions ⚠️

**Most Common Problem!**

When you click the call button, your browser should ask:
> "localhost wants to use your Camera and Microphone"

**Fix:**
1. Click **Allow** when prompted
2. If you accidentally clicked Block, fix it:
   - Click the 🔒 or ⓘ icon in address bar
   - Find Camera and Microphone permissions
   - Change to "Allow"
   - Refresh the page

---

### Issue 2: Testing Setup

**You need TWO users online at the same time:**

✅ **Correct Way:**
1. Window 1 (Regular): Login as `alice`
2. Window 2 (Incognito/Private): Login as `bob`
3. In Alice's window: Click on Bob in the sidebar (select the user)
4. Click 📞 or 📹 button
5. In Bob's window: Accept the incoming call

❌ **Wrong Way:**
- Only one window open
- Not selecting a user before calling
- Using same browser window

---

### Issue 3: Browser Compatibility

**Best Browsers for WebRTC:**
- ✅ Chrome (best)
- ✅ Firefox (good)
- ⚠️ Safari (can be tricky)
- ❌ Old browsers

**Try:**
- Use Chrome or Firefox
- Update to latest version
- Try in incognito mode

---

### Issue 4: Check Browser Console

**See actual errors:**

1. Press `F12` or `Cmd+Option+I` (Mac)
2. Click "Console" tab
3. Click the call button
4. Look for red error messages
5. Send me the error if you see one

**Common errors:**
- `NotAllowedError` → You blocked permissions
- `NotFoundError` → No camera/mic detected
- `NotReadableError` → Camera in use by another app

---

### Issue 5: Both Users Must Be Online

**WebRTC needs both users connected:**

✅ Check:
- Both windows show users as "🟢 Online"
- You selected the other user before calling
- Both are logged in simultaneously

---

## Step-by-Step Call Test

### **Window 1 - Alice:**
```
1. Open: http://localhost:3000
2. Login: alice / test123
3. Wait for Bob to appear in sidebar
4. Click on Bob's name in sidebar (should highlight)
5. Click 📹 (video call button)
6. Click "Allow" when browser asks for camera/mic
7. Wait for Bob to answer
```

### **Window 2 - Bob (Incognito):**
```
1. Press Cmd+Shift+N (open incognito)
2. Go to: http://localhost:3000
3. Login: bob / test123
4. You should see "Incoming call from alice"
5. Click "Allow" when browser asks for camera/mic
6. Click "Answer"
7. You're in a call!
```

---

## Quick Diagnostic Commands

Run these in browser console (F12):

```javascript
// Check if getUserMedia is supported
navigator.mediaDevices.getUserMedia({audio: true, video: true})
  .then(stream => console.log('✅ Camera/Mic working!', stream))
  .catch(err => console.error('❌ Error:', err.name, err.message));

// Check WebRTC support
console.log('RTCPeerConnection:', typeof RTCPeerConnection !== 'undefined' ? '✅ Supported' : '❌ Not supported');
```

---

## If Still Not Working

### Option 1: Test Just Audio First
1. Use 📞 (voice) instead of 📹 (video)
2. Only requires microphone permission
3. Easier to debug

### Option 2: Check Network/Firewall
- WebRTC works peer-to-peer
- Might need STUN/TURN servers for some networks
- Works best on same WiFi network

### Option 3: Try Different Browser
1. Close all windows
2. Open Chrome (not Safari)
3. Test again

---

## Camera/Mic Access on Mac

**Check System Permissions:**

1. Open **System Settings**
2. Go to **Privacy & Security**
3. Click **Camera** → Make sure your browser is allowed
4. Click **Microphone** → Make sure your browser is allowed
5. Restart browser

---

## Still Having Issues?

**Tell me:**
1. Which browser are you using?
2. What happens when you click call button?
3. Do you see any error messages?
4. Did browser ask for camera/mic permission?

**Check these:**
- [ ] Both users logged in different windows?
- [ ] Selected the user before clicking call?
- [ ] Allowed camera/microphone permissions?
- [ ] Using Chrome or Firefox?
- [ ] Both users show as "Online"?

---

## Expected Behavior

**When working correctly:**

1. Alice clicks 📹 on Bob
2. Browser asks Alice: "Allow camera/mic?" → Click Allow
3. Bob sees: "📞 Incoming video call from alice"
4. Browser asks Bob: "Allow camera/mic?" → Click Allow  
5. Bob clicks "Answer"
6. Both see each other's video!

---

**Most likely issue: Browser permissions not granted. Try the step-by-step test above!** 🎥
