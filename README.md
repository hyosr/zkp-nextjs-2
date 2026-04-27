# ZKP Vault — Next.js UI

This is the Next.js 14 replacement for the Streamlit `frontend/dashboard.py` in the `zkp-credential-sharing` project.

## Structure

```
src/
├── app/
│   ├── page.tsx                    # Login / ZKP auth (replaces Streamlit login)
│   ├── layout.tsx
│   ├── globals.css
│   ├── dashboard/
│   │   ├── layout.tsx              # Auth guard + sidebar layout
│   │   ├── page.tsx                # Overview / stats
│   │   ├── credentials/page.tsx    # Credential CRUD
│   │   ├── sharing/page.tsx        # Share management + relay login + Keycloak
│   │   └── audit/page.tsx          # Audit log
│   └── recipient/
│       └── page.tsx                # Recipient handoff + device flow polling
├── components/
│   ├── ui/index.tsx                # Button, Input, Card, Badge, Alert, Modal, Spinner
│   └── layout/DashboardLayout.tsx  # Sidebar navigation
└── lib/
    ├── api.ts                      # All FastAPI backend calls
    ├── auth-context.tsx            # Auth state (token in localStorage)
    └── zkp.ts                      # Client-side ZKP proof derivation + utils
```

## Pages vs Streamlit

| Streamlit section           | Next.js route               |
|-----------------------------|-----------------------------|
| ZKP Login tab               | `/` (login page)            |
| Register tab                | `/` (toggle to register)    |
| Credential Management       | `/dashboard/credentials`    |
| Sharing + Relay Login       | `/dashboard/sharing`        |
| Keycloak Device Flow        | `/dashboard/sharing` (modal)|
| Audit Log                   | `/dashboard/audit`          |
| Recipient Handoff           | `/recipient`                |
| Keycloak Recipient Polling  | `/recipient?kc_session_id=…`|

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.local.example .env.local
# Edit .env.local: set ZKP_API_URL to your FastAPI backend

# 3. Run dev server
npm run dev
# → http://localhost:3000
```

## Environment Variables

```
ZKP_API_URL=http://localhost:8001           # FastAPI backend (server-side rewrite)
NEXT_PUBLIC_API_URL=http://localhost:3000/api/backend  # Used by browser
```

The `next.config.js` proxies `/api/backend/*` → FastAPI backend, so no CORS issues.

## ZKP Proof

The `src/lib/zkp.ts` file implements client-side proof derivation using Web Crypto API (PBKDF2 + HMAC-SHA256). **You must align this with your backend's verification logic** in `backend/auth/`. The current implementation mirrors a HMAC-based Schnorr-like protocol.

## Recipient Deep Links

The extension or owner can share deep links:
- Direct handoff: `http://localhost:3000/recipient?session_id=<session_id>`
- Keycloak flow: `http://localhost:3000/recipient?kc_session_id=<kc_session_id>`

## Production

```bash
npm run build
npm start
```

Or deploy to Vercel: `vercel --prod` (set env vars in dashboard).
