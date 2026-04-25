# Which `.env` file is which?

This repo has **more than one app**, so you need **more than one env file**. They are **not** interchangeable.

| App / process | File to use | What it’s for |
|---------------|-------------|----------------|
| **Expo (phone)** | `apps/mobile/.env` | `EXPO_PUBLIC_*` is **baked in when Metro starts**. Tells the **React Native** app the URL of your API (e.g. `http://10.30.5.243:3000`). |
| **Next.js (API on your computer)** | `apps/web/.env.local` | **Server-only** secrets: Mongo, Anthropic, Twilio, Cloudinary, JWT, etc. Used when you run `npm run dev` in `apps/web`. |
| **Vite `apps/web/Aida`** (separate small UI) | `apps/web/Aida/.env` | `VITE_*` for that front-end only (e.g. Cloudinary widget). Not used by the Expo app. |

**Do not** put `EXPO_PUBLIC_API_URL` only in `apps/web/.env.local` and expect the phone app to see it. Next does not bundle the mobile app, and **Expo does not read `web/.env.local`**.

**There is no single root `.env`** that both clients read unless you add custom tooling. Use the table above.

### After changing `apps/mobile/.env`

Stop Metro/Expo completely and start again so the new URL is included in the JS bundle.

### Checklist if the still phone can’t connect

1. `cd apps/web && npm run dev` — server running (port 3000 by default).  
2. On the **phone’s browser**: open `http://<your-lan-ip>:3000` — if it won’t load, it’s a network/firewall issue, not the app.  
3. **Same Wi‑Fi** (or same LAN) as the computer running Next.  
4. Corporate / guest networks often block **device-to-device** traffic — use a normal home lab Wi‑Fi if possible.
