# AgriMate Mobile App

The farmer-facing app — React Native + Expo (TypeScript), Expo Router. Talks **only**
to the Spring Boot backend. Camera-first UX, green & white theme, trilingual (EN/SI/TA).

## Run
```bash
npm install
# point the app at your backend (physical phone needs your LAN IP):
echo "EXPO_PUBLIC_API_URL=http://<your-ip>:8080" > .env
npx expo start            # press a for Android, or scan the QR with Expo Go
```

## What's built
- **Auth** — login by **username or email**, register (username/email/password/name/phone),
  JWT with auto-refresh, secure token storage (SecureStore on device, AsyncStorage on web).
- **Guest mode** — "Continue as guest" gives AI scan + knowledge base + settings only;
  farms, crops and history require an account (gated with a friendly prompt).
- **Theming** — light / dark / system, persisted; every screen is theme-aware (`useColors()`).
- **Offline-first** — local SQLite (Drizzle ORM) is the source of truth for farms, crops,
  scans cache and the knowledge base. Create/edit/delete farms & crops fully offline; a sync
  engine (`data/sync.ts`) pushes pending changes and pulls server state when back online
  (NetInfo-driven). Only the AI scan itself needs a connection.
- **i18n** — English / Sinhala / Tamil via i18next; choice persisted; live switch in Settings.
- **Home** — greeting, big scan CTA, farm + recent-scan previews, pull to refresh.
- **Farms** — list / add / edit / delete farms, GPS capture ("use my location"), crops per farm.
- **Scan flow** (critical path) — pick farm/crop → camera or gallery → upload → diagnosis.
- **Result** — disease, confidence, color-coded severity, treatment/prevention/symptoms/cause
  from the knowledge base, top-3, **low-confidence prompt** to ask an agronomist, demo-mode notice.
- **History** — paged scan list, filter by disease, tap for full result.
- **Learn** — searchable disease library (the 5 paddy diseases) with detail pages.
- **Profile** — language switch, role/status, logout.

## Structure
```
src/
  api/         axios client (JWT refresh interceptor) + typed endpoints + types
  app/         expo-router routes: (auth), (tabs), farm/[id], scan/[id], scan/result, disease/[key], settings
  components/  ui.tsx (theme-aware Button, Card, TextField, SeverityBadge…), ScanResultView, AccountGate
  context/     AuthContext (+ guest), ThemeContext, SyncProvider
  db/          Drizzle schema + SQLite client (offline store)
  data/        offline-first repositories (farms, crops, scans, diseases) + sync engine
  net/         connectivity (NetInfo) helpers
  i18n/        i18next config + en/si/ta locales
  theme/       light + dark design tokens
  utils/       formatting, uuid, scan-result handoff store
```

## Notes
- The "central camera button" lives in the bottom tab bar (`(tabs)/_layout.tsx`).
- Severity is color-coded (red = high, amber = warning/low-confidence, green = healthy).
- `npx tsc --noEmit` typechecks clean. Typed routes are enabled (regenerated on `expo start`).
