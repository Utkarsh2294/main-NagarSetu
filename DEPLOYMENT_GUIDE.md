# NagarSetu Deployment Guide (Render)

Your codebase is **100% ready** for production deployment on [Render](https://render.com). The `package.json` scripts and `server.js` routing have already been configured to automatically build the React frontend and serve it alongside the Express backend in a single optimized container.

## Deployment Steps

1. **Push your code to GitHub** (if you haven't already).
2. **Log into Render Dashboard** and click **New > Web Service**.
3. **Connect your GitHub repository**.
4. **Configure the Web Service**:
   - **Name**: `nagarsetu` (or whatever you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. **Add Environment Variables** (Under the Advanced / Environment Variables section):
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = *(Your Gemini API key)*
   - `MONGODB_URI` = *(Your MongoDB Atlas connection string)*
   - `VITE_GOOGLE_CLIENT_ID` = *(Your Google OAuth Client ID)*
   - `ADMIN_JWT_SECRET` = *(A random secure string for admin dashboard security)*
6. Click **Create Web Service**.

Render will automatically install the dependencies, build the Vite frontend (`npm run build`), and then start your server (`npm start`). Your app will be live within a few minutes!
