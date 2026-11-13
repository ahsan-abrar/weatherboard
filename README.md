# WeatherBoard

A personal weather dashboard built with React, TypeScript and Tailwind CSS. Search any city, see
current conditions and a 5-day forecast, save up to five favourites, switch units or theme, install
the app, use the last city offline, and get a daily morning reminder.

- **Live app:** https://weatherboard-lyart.vercel.app
- **Repository:** https://github.com/ahsan-abrar/weatherboard
- **Built with:** [OpenCode](https://opencode.ai) — full prompt history in [PROMPTS.md](./PROMPTS.md)
- **Implementation plan:** [PLAN.md](./PLAN.md)

---

## Features

- **City search with autocomplete** — 300 ms debounce, cancelled stale requests, keyboard navigation,
  visible loading / no-results / API-error states and inline validation on blur and submit.
- **Real weather data** — current temperature, feels-like, humidity, wind, daily high/low and a 5-day
  forecast with temperature-range bars.
- **Favourite cities** — up to five, saved in `localStorage`, one-click access, confirm-before-remove
  modal and graceful behaviour when storage is blocked.
- **Units and theme** — °C/°F and light/dark/system, both persisted and applied without a reload.
- **Offline mode** — cache-first last city, offline banner, stale-data hint and a clear no-cache state.
- **Installable PWA** — manifest, 192/512/maskable icons, service worker, app-shell precache and cached
  weather requests.
- **Daily reminder** — explained before the permission prompt, user-chosen time, service-worker
  notification, test notification and blocked/unsupported fallbacks.
- **Responsive** — verified at 375 px, 768 px and 1280 px with no horizontal scroll and 44×44 px touch
  targets on mobile.
- **Reviewer preview states** — the visible bar can force Offline / Loading / Fetch error / Blocked
  notifications without waiting for real failures, and includes a “Send test notification” action.

---

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens) |
| HTTP | Axios with shared client + interceptor files |
| Icons | lucide-react |
| PWA | vite-plugin-pwa + Workbox |
| State | React state in `App.tsx`, small presentational components |
| Storage | `localStorage` for settings/favourites/cache, IndexedDB for the reminder schedule |

No backend is required. All data comes from public APIs and is cached on the client.

---

## Getting started

**Requirements:** Node.js 22+ and npm.

```bash
npm install
cp .env.example .env.local   # add your free-tier keys
npm run dev
```

Open http://localhost:5173.

### Environment variables

```env
VITE_OPENWEATHER_KEY=
VITE_GEODB_KEY=
```

| Variable | Used for | Without it |
| --- | --- | --- |
| `VITE_OPENWEATHER_KEY` | OpenWeatherMap current conditions + 5-day forecast | Falls back to Open-Meteo |
| `VITE_GEODB_KEY` | GeoDB Cities (RapidAPI) autocomplete | Open-Meteo geocoding is still queried |

The app deliberately works without keys: Open-Meteo's forecast and geocoding endpoints are called as
the keyless fallback. Add keys to exercise the keyed integrations.

> Vite exposes `VITE_*` values in the client bundle. Free-tier keys are acceptable for this challenge;
> a production app should proxy requests through a serverless function.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

---

## Architecture

```
UI components
   │
   ├── App.tsx                state, cache-first load, favourites, settings, reminders
   │
   ├── lib/api/               Axios clients + interceptors + provider services
   │     ├── client.ts
   │     ├── interceptors.ts
   │     └── index.ts         search / weather / fallback / cache
   │
   ├── lib/notifications/     permission flow + service-worker sync
   ├── lib/constants/         every shared constant
   ├── lib/types/             shared TypeScript types
   └── lib/utils/             storage, units, dates, same-city helper
```

### Data providers

- **Search:** Open-Meteo geocoding and GeoDB are queried in parallel. Results are merged by
  name + country, deduplicated, and capped at six. Open-Meteo leads because it covers more cities;
  GeoDB adds its population-ranked results when available.
- **Weather:** OpenWeatherMap (`/weather` + `/forecast`) when a key exists, with automatic fallback to
  Open-Meteo forecast on missing key, rate limit or request failure.
- **Normalisation:** both providers map to one internal shape (`City`, `CurrentWeather`,
  `ForecastDay`). Components never see provider-specific payloads.
- **Units:** all values are stored in °C / km/h and converted only for display.

### Caching and offline

1. The latest successful snapshot is written to `localStorage` (`weatherboard:cached-weather`).
2. Startup paints that snapshot immediately, then refreshes in the background.
3. The service worker precaches the app shell and uses Workbox `NetworkFirst` for weather/city APIs.
4. If a refresh fails, the cached view stays visible with a short notice.
5. Cached data older than 30 minutes is marked as potentially out of date.

### Service worker

Generated by `vite-plugin-pwa` (`generateSW`) with `public/notification-sw.js` imported for reminder
scheduling and notification clicks. The generated worker precaches the shell and serves the
`index.html` navigation fallback offline.

---

## Daily reminder — important limitation

The reminder is implemented with the browser **Notifications API + service worker**:

- The UI explains what will happen before `Notification.requestPermission()` is called.
- The chosen time and enabled state are stored and sent to the service worker.
- While the app is open, a page-side timer shows the notification at the chosen time, so changing
  the time immediately reschedules it.
- The worker saves the schedule in IndexedDB, shows the notification when due, and catches up a
  missed reminder when it starts again.
- Where supported (installed PWA in Chromium), periodic background sync wakes the worker to check.
- Page and worker share an atomic notification slot, so only one notification appears per reminder.
- Clicking a notification focuses the open app or opens `https://weatherboard-lyart.vercel.app/`.
- Denied/unsupported permission shows a clear inline fallback and does not break the rest of the app.

**Client-only scheduling still cannot be guaranteed when the browser is fully closed.** Browsers may
stop a service worker at any time, and there is no push service in this project to wake it. The worker
reschedules and catches up when it next starts, and periodic sync helps where available. Guaranteed
delivery would need a push subscription and a small server.

---

## Validation & error handling

- Empty city, unselected suggestion, no results and network failure each have specific messages.
- Validation runs on blur **and** submit.
- Requests are cancelled when the query changes, so stale suggestions never win.
- Provider failures are normalised by Axios interceptors into friendly `ApiError` objects.
- Every async view has loading, success and error states; failures offer a retry where possible.
- Favourites survive storage failures in memory for the session and show a warning.

---

## Project structure

```
src/
  App.tsx                 app state and screen composition
  index.css               Tailwind + theme tokens + base styles
  components/             Sidebar, SearchBar, CurrentWeather, StatsCard,
                          ForecastList, Banners, ConfirmDialog, WeatherIcon
  lib/
    api/                  Axios client, interceptors, search + weather services
    constants/            shared constants and messages
    notifications/        permission + service-worker helpers
    types/                shared types and Vite env types
    utils/                storage, units, dates, formatting
public/
  icons/                  PWA icons
  notification-sw.js      reminder scheduling + notification click
```

---

## Deployment

Deployed on **Vercel** from the `main` branch:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_OPENWEATHER_KEY`, `VITE_GEODB_KEY`

The live HTTPS deployment is required for service workers, installation and notifications.

---

## Known limitations

- Daily notifications are best-effort once the browser is fully closed (see above).
- Free-tier API keys are visible in the client bundle.
- Provider rate limits and temporary outages fall back to the keyless weather source.
- GeoDB's free dataset does not include every city; merged Open-Meteo results cover the gaps.
- Search shows results after the debounce plus network latency, not a guaranteed 300 ms end-to-end.
- There is no automated test suite; the app is verified with lint, build and manual responsive/PWA
  checks. `PLAN.md` records the implementation and verification steps.
