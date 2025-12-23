# Quick Start Guide - Google OAuth Authentication

This is a condensed guide to get you up and running quickly. For detailed instructions, see [OAUTH_SETUP.md](OAUTH_SETUP.md).

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (1 minute)

```powershell
# Option A: Use the setup script
.\setup.ps1

# Option B: Manual installation
cd backend
npm install
```

### Step 2: Get Google OAuth Credentials (2 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Configure OAuth consent screen if prompted
6. Set Application type: "Web application"
7. Add Authorized redirect URI: `http://localhost:3000/auth/google/callback`
8. Copy your **Client ID** and **Client Secret**

### Step 3: Configure Environment (1 minute)

Create `backend/.env` file:

```env
# Copy this template and fill in your values
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
SESSION_SECRET=generate_a_random_32_character_string_here
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Generate a strong session secret:**
```powershell
# PowerShell command to generate random secret
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Step 4: Start the Server (30 seconds)

```bash
cd backend
npm start
```

### Step 5: Test It! (30 seconds)

1. Open browser: `http://localhost:3000`
2. Click "Continue with Google"
3. Sign in with your Google account
4. You're in! 🎉

## 🎯 What You Get

After setup, users can:
- ✅ Sign in with Google
- ✅ See their profile picture and name
- ✅ Track game statistics (wins, games played, win rate)
- ✅ Auto-fill player name from profile
- ✅ Secure session management

## 🔍 Quick Troubleshooting

### "Redirect URI mismatch"
- Make sure callback URL in `.env` exactly matches Google Console
- Check for trailing slashes (they matter!)

### "Cannot find module 'passport'"
- Run `npm install` in the backend directory

### Session not saving
- Check that `SESSION_SECRET` is set in `.env`
- Clear browser cookies and try again

### Still stuck?
See [OAUTH_SETUP.md](OAUTH_SETUP.md) for detailed troubleshooting.

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend/.env` | Your credentials (create this!) |
| `backend/config/passport.js` | OAuth configuration |
| `backend/services/userService.js` | User data management |
| `frontend/login.html` | Login page |
| `frontend/auth-client.js` | Client-side auth helper |

## 🚀 Production Deployment

When deploying to production:

1. Update Google OAuth credentials with production URLs
2. Set `NODE_ENV=production` in `.env`
3. Use HTTPS (required for secure cookies)
4. Generate a new strong `SESSION_SECRET`
5. Update `FRONTEND_URL` and `GOOGLE_CALLBACK_URL`

Example production `.env`:
```env
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
SESSION_SECRET=super_strong_production_secret_here
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

## 📚 More Information

- **Detailed Setup**: [OAUTH_SETUP.md](OAUTH_SETUP.md)
- **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **General Info**: [README.md](README.md)

## 🎮 Ready to Play!

Once setup is complete:
1. Create a room
2. Share the room code with friends
3. Play Ludo with authentication and stat tracking!

**Enjoy! 🎲**
