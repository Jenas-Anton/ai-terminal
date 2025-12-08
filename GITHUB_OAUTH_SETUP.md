# GitHub OAuth Setup Guide

## Steps to get GitHub OAuth credentials:

### 1. Go to GitHub Developer Settings
- Visit: https://github.com/settings/developers
- Click "New OAuth App"

### 2. Fill in the Application Details
- **Application name**: Orbital CLI
- **Homepage URL**: `http://localhost:3000`
- **Authorization callback URL**: `http://localhost:3005/api/auth/callback/github`

### 3. Copy Credentials
You'll get:
- **Client ID** → Copy this
- **Client Secret** → Copy this (keep it secret!)

### 4. Update your .env file
```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

### 5. Restart your server
The GitHub login should now work!

---

## Callback URL
Make sure your callback URL is set to exactly:
`http://localhost:3005/api/auth/callback/github`

Better Auth will automatically handle the `/api/auth/callback/github` endpoint once credentials are configured.

---

## Troubleshooting

If GitHub login still doesn't work:
1. ✅ Check that credentials are correctly added to `.env`
2. ✅ Restart the server (`npm run dev`)
3. ✅ Check that the callback URL matches in GitHub settings
4. ✅ Check server logs for Better Auth debug messages
