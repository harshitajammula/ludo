# Google OAuth 2.0 Setup Guide for Ludo Game

This guide will walk you through setting up Google OAuth 2.0 authentication for your Ludo game.

## 📋 Prerequisites

- Node.js (v14 or higher)
- A Google account
- Access to Google Cloud Console

## 🚀 Step 1: Install Dependencies

Navigate to the backend directory and install the required packages:

```bash
cd backend
npm install
```

This will install:
- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth 2.0 strategy
- `express-session` - Session management
- `dotenv` - Environment variable management

## 🔑 Step 2: Set Up Google OAuth Credentials

### 2.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: "Ludo Game" (or your preferred name)
5. Click "Create"

### 2.2 Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 2.3 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: Select "External"
   - App name: "Ludo Game"
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Click "Save and Continue" (we'll use default scopes)
   - Test users: Add your email for testing
   - Click "Save and Continue"

4. Back to creating OAuth client ID:
   - Application type: "Web application"
   - Name: "Ludo Game Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - Add your production URL when deploying
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback`
     - Add your production callback URL when deploying
   - Click "Create"

5. **IMPORTANT**: Copy your Client ID and Client Secret - you'll need these!

## ⚙️ Step 3: Configure Environment Variables

1. In the `backend` directory, create a `.env` file:

```bash
cd backend
copy .env.example .env
```

2. Edit the `.env` file and add your Google OAuth credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Google OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Session Secret (generate a random string)
SESSION_SECRET=generate_a_random_string_here_use_a_password_generator

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Security Tips:**
- Never commit the `.env` file to version control (it's already in `.gitignore`)
- Use a strong, random session secret (at least 32 characters)
- In production, use HTTPS and update all URLs accordingly

## 🎮 Step 4: Start the Server

```bash
cd backend
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## 🧪 Step 5: Test Authentication

1. Open your browser and go to `http://localhost:3000`
2. You should be redirected to the login page
3. Click "Continue with Google"
4. Sign in with your Google account
5. After successful authentication, you'll be redirected to the game

## 📁 Project Structure

The authentication system includes:

```
backend/
├── config/
│   └── passport.js          # Passport.js configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   └── auth.js              # Authentication routes
├── services/
│   └── userService.js       # User data management
├── data/
│   └── users.json           # User database (auto-created)
├── .env                     # Environment variables (create this)
└── .env.example             # Environment template

frontend/
└── login.html               # Login page
```

## 🔐 Authentication Flow

1. User visits the app → Redirected to `/login` if not authenticated
2. User clicks "Continue with Google" → Redirected to Google OAuth
3. User authorizes the app → Google redirects back to `/auth/google/callback`
4. Server creates/updates user in database → Creates session
5. User is redirected to the game → Can now play!

## 🛡️ Security Features

- ✅ Session-based authentication
- ✅ Secure HTTP-only cookies
- ✅ CSRF protection via session
- ✅ User data stored locally (can upgrade to database)
- ✅ Protected game routes
- ✅ Automatic session expiration (24 hours)

## 🔄 API Endpoints

### Public Endpoints
- `GET /login` - Login page
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /api/health` - Health check

### Protected Endpoints
- `GET /` - Game homepage (requires authentication)
- `GET /auth/status` - Check authentication status
- `GET /auth/profile` - Get user profile
- `GET /auth/logout` - Logout user

## 🚢 Production Deployment

When deploying to production:

1. Update your Google OAuth credentials:
   - Add production URLs to authorized origins
   - Add production callback URL

2. Update `.env` for production:
   ```env
   NODE_ENV=production
   GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   SESSION_SECRET=use_a_very_strong_secret_here
   ```

3. Use HTTPS (required for secure cookies)

4. Consider upgrading from file-based storage to a database (MongoDB, PostgreSQL, etc.)

## 🐛 Troubleshooting

### "Error: Failed to serialize user into session"
- Make sure the user object has an `id` field
- Check that `userService.js` is working correctly

### "Redirect URI mismatch"
- Verify the callback URL in `.env` matches Google Console
- Check for trailing slashes (they matter!)

### "Session not persisting"
- Check that cookies are enabled in your browser
- Verify `SESSION_SECRET` is set in `.env`
- In production, ensure `secure: true` and HTTPS is used

### "Cannot find module 'passport'"
- Run `npm install` in the backend directory
- Check that all dependencies are in `package.json`

## 📚 Next Steps

- [ ] Add user profile page showing stats
- [ ] Implement game statistics tracking
- [ ] Add friend system
- [ ] Upgrade to database (MongoDB/PostgreSQL)
- [ ] Add email notifications
- [ ] Implement password reset (if adding local auth)

## 🤝 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Ensure Google OAuth credentials are valid
4. Check that the callback URL matches exactly

---

**Happy Gaming! 🎲**
