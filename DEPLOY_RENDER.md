# Deploy VipuDevAI Studio on Render

> **VipuDev.AI - Short. Sharp. Execute...**

## Quick Deployment Steps

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "VipuDevAI Studio - Short. Sharp. Execute..."
git branch -M main
git remote add origin https://github.com/yourusername/vipudevai-studio.git
git push -u origin main
```

### 2. Create Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy your connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Deploy on Render

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click **New +** → **Blueprint** (or **Web Service**)
3. Connect your GitHub repository
4. Render will detect `render.yaml` and auto-configure

Or configure manually:

| Setting | Value |
|---------|-------|
| **Name** | `vipudevai-studio` |
| **Environment** | `Node` |
| **Build Command** | `npm install && npm run build && npm run db:push` |
| **Start Command** | `npm run start` |
| **Plan** | `Free` |

### 4. Set Environment Variables

In Render dashboard → **Environment** tab, add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string |
| `ADMIN_USERNAME` | `admin` (or your username) |
| `ADMIN_PASSWORD` | Your secure password |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `NODE_ENV` | `production` |

### 5. Access Your App

Your app will be live at:
```
https://vipudevai-studio.onrender.com
```

Login with your admin credentials.

---

## Features

- **AI Chat with Vipu**: Empathetic GPT-4 assistant with real-time web search
- **Long Memory**: Conversations persist across sessions
- **Live Sandbox**: HTML/CSS/JS editor with instant preview
- **Code Runner**: Execute JavaScript & Python
- **DALL·E Integration**: Generate AI images
- **Project Management**: Organize multi-file projects
- **Multi-cloud Deploy**: Vercel, Render, Railway guidance

---

## Notes

- **Free tier**: App may spin down after 15 min of inactivity (first request takes ~30s to wake)
- **Auto-deploy**: Pushes to `main` branch trigger automatic redeploys
- **Custom domain**: Add in Render Settings → Custom Domains

---

Built with love by Balaji for Vipu.
**VipuDev.AI - Short. Sharp. Execute...**
