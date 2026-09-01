# J.A.R.V.I.S. HTTPS cloud deployment

The `ios-version` branch is prepared for deployment as a Node/Express web app on a Docker-capable HTTPS host.

## Recommended setup

The repository includes `Dockerfile` and `render.yaml` for Render.

1. Create/sign in to a Render account.
2. Create a new Blueprint and select this GitHub repository.
3. Select the `ios-version` branch and use `render.yaml`.
4. Deploy the `jarvis-assistant-app` web service.
5. Keep provider API keys as server-side environment variables; do not put secrets in `public/` or client JavaScript.
6. After deployment, Render provides an HTTPS `onrender.com` URL.
7. In the Render service's Custom Domains settings, add `jarvis-assistant-app.com`.
8. At the domain registrar/DNS provider, follow Render's displayed DNS records exactly. HTTPS is provisioned by Render after DNS verification.

## Runtime

The service listens on the platform-provided `PORT` and exposes `/api/assistant/status` as its health check. The existing Express server serves `public/` and the application API from the same origin, so Safari can use the deployed URL without a separate frontend host.

## Database

The application currently uses SQLite via `better-sqlite3`. For persistent memory across redeploys/restarts, attach persistent storage at `/data` on the selected cloud host. Without persistent storage, the app can run, but SQLite data may be lost when the instance is replaced.

## Important limitation

This repository change prepares and configures the application for cloud hosting. It does not register or control the `jarvis-assistant-app.com` domain, create a Render account, or change DNS records. Those actions require access to the user's hosting and domain accounts.
