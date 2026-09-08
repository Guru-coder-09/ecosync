# EcoSync — GoI DPI Prototype
## Ecological Carrying Capacity Governance System

---

## Quick Start (Demo Mode — No Supabase required)

```bash
# 1. Install dependencies
npm install

# 2. Run in demo mode (no env vars needed)
npm run dev
```

Open http://localhost:5173 and use these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Tourist | tourist@demo.ecosync.in | demo1234 |
| Guard | guard@demo.ecosync.in | demo1234 |
| Authority | authority@demo.ecosync.in | demo1234 |

---

## Production Setup (with Supabase)

### 1. Create Supabase project
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Run database migration
```bash
supabase db push
# or manually paste supabase/migrations/001_ecosync_schema.sql into the SQL editor
```

### 3. Generate Ed25519 keypair
```bash
# Generate private key
openssl genpkey -algorithm Ed25519 -out private.pem

# Extract public key
openssl pkey -in private.pem -pubout -out public.pem

# Set as Supabase secrets
supabase secrets set ECOSYNC_ED25519_PRIVATE_KEY_PEM="$(cat private.pem)"

# Optional: precompute public JWK and set separately for faster cold starts
```

### 4. Deploy Edge Functions
```bash
supabase functions deploy sign-permit
supabase functions deploy get-public-key
```

### 5. Configure environment
```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase dashboard
```

### 6. Build and deploy to Render
```bash
npm run build
# Deploy dist/ folder to Render as a Static Site
# Build command: npm run build
# Publish directory: dist
```

---

## Architecture

```
ecosync/
├── supabase/
│   ├── migrations/001_ecosync_schema.sql   # PostGIS schema + RLS
│   └── functions/
│       ├── sign-permit/      # Ed25519 signing (private key server-only)
│       └── get-public-key/   # Returns public JWK for offline verification
├── src/
│   ├── crypto/
│   │   └── permitCrypto.ts   # Ed25519 sign + verify engine
│   ├── lib/
│   │   ├── types.ts          # All TypeScript types
│   │   ├── supabase.ts       # Client singleton
│   │   ├── db.ts             # Typed query helpers
│   │   ├── idb.ts            # IndexedDB offline queue
│   │   ├── utils.ts          # IST formatting, validators
│   │   ├── env.ts            # IS_DEMO_MODE detection
│   │   └── mockData.ts       # Demo data (8 zones, permits, scan logs)
│   ├── stores/               # Zustand state with mock/prod branching
│   ├── components/           # Shared UI (QRDisplay, CapacityBar, ZoneMap…)
│   └── routes/
│       ├── Tourist/          # /  — E-Pass booking portal
│       ├── Authority/        # /authority — NDMA command dashboard
│       └── Scanner/          # /scanner — Guard PWA (offline QR verification)
└── public/
    ├── manifest.json         # PWA manifest
    └── sw.js                 # Service worker
```

## Security Design

| Concern | Mitigation |
|---------|-----------|
| Private key exposure | Ed25519 private key stored in Supabase secrets, only used in Edge Function. Never sent to client. |
| Screenshot/replay attacks | 30-second rotating TOTP salt embedded in signed JWT. QR refreshes every 30s. |
| Clock drift (mountain checkposts) | Scanner accepts `salt === current \|\| salt === current - 1` (±30s grace window). |
| IST offset bugs | All DB timestamps: `TIMESTAMPTZ` (UTC). All display: `Intl.DateTimeFormat({timeZone:'Asia/Kolkata'})`. |
| Offline scan data loss | IndexedDB queue. Auto-sync on reconnect. Immutable `scan_logs` DB table. |
| Tamper evidence | Ed25519 signature verification rejects any modified QR payload. |
| RLS | Tourists: own permits only. Guards: scan_logs INSERT only. Authority: full access. |

## Timezone Compliance

All timestamps in DB are `TIMESTAMPTZ` (UTC). Frontend uses:
- `formatISTDateTime()` → IST display (via `Intl.DateTimeFormat({timeZone:'Asia/Kolkata'})`)
- `utcToISTInput()` / `istInputToUTC()` → datetime-local input conversion (adds/subtracts 5.5h offset)
- TOTP salt: `Math.floor(Date.now() / 30000)` — UTC-based, no timezone risk
