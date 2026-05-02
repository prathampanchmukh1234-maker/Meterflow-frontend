# MeterFlow Frontend

React/Vite frontend for MeterFlow.

## Local Development

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173` and proxies `/api` and `/socket.io` to `http://localhost:3000` in development.

## Vercel Deployment

Use this repository as a Vercel Vite project.

- Build command: `npm run build`
- Output directory: `dist`

Update `vercel.json` and replace `https://YOUR_BACKEND_DOMAIN` with the deployed Render backend URL.

Required environment variables are listed in `.env.example`.
