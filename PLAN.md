# WeatherBoard — Implementation Plan

**Challenge:** Edspire Frontend (React) Technical Challenge · deadline Sat 14 Nov 2026, 11:00 AM PKT
**Stack:** React 19 + TypeScript + Vite 8, **Tailwind CSS v4**, **Axios**, **lucide-react** icons, client-side only, PWA
**Design:** the attached screenshot (light theme, sidebar + main weather panel)

**Rules for this build**

- Build **one step at a time**. Stop after each step for review, then continue only on approval.
- Keep it simple: no state library, no routing, no folder-per-feature, no premature abstraction.
- One constants file (`src/constants.ts`) for URLs, keys, limits, defaults, messages.
- One utils file (`src/utils.ts`) for helpers reused in more than one place.
- Code must be short and readable; a new developer should follow it without a diagram.
- Comments explain **why**, not syntax.

---

## 1. Requirements checklist

| # | Requirement | Step |
|---|---|---|
| 01 | City search with **live autocomplete** (GeoDB via RapidAPI), results within **300 ms** of pause, visible no-results + API-error states | 4–5 |
| 02 | **Real** current conditions + **5-day** forecast; loading and friendly error on every fetch | 4–6 |
| 03 | Validation on **blur** and submit; empty field, no results, network failure with specific inline messages | 5 |
| 04 | Up to **5 favourites**, localStorage, quick access, **confirm before remove**, degrade if storage blocked | 6 |
| 05 | Installable **PWA**, manifest + 192/512 icons, service worker caches app shell + last city, offline usable, offline banner | 8–9 |
| 06 | Daily morning reminder, user-chosen time, fires with tab closed, explain before permission prompt, unsupported/denied fallback | 10 |
| 07 | Responsive at **375 / 768 / 1280**, no horizontal scroll, **44×44 px** touch targets | 2–3 |
| Bonus | Dark/light with system preference, °C/°F persisted without reload, animated condition icons | 7 |
| Submission | README + PROMPTS.md, live URL, public repo | 11 |

Also built because the screenshot shows it: the **“Preview states”** bar (Offline / Loading / Fetch error / Blocked notifications) so every state can be inspected in one click.

---

## 2. Data strategy (keyless fallback, so the live URL always works)

| Role | Primary | Fallback |
|---|---|---|
| Search / autocomplete | **GeoDB Cities** (RapidAPI key) | **Open-Meteo geocoding** (no key) |
| Current + 5-day weather | **OpenWeatherMap** (key) | **Open-Meteo forecast** (no key) |

- Keys live in `.env.local` as `VITE_OPENWEATHER_KEY` and `VITE_GEODB_KEY`; `.env.example` is committed.
- If a key is missing or a request fails/rate-limits, the same UI falls through to Open-Meteo automatically.
- Vite env vars are public in the bundle — acceptable for free-tier keys, noted in README.
- All API responses are mapped to one internal shape in `api.ts`, so components never see provider formats.

**Unit/status decision:** store everything internally in °C and convert on render. Weather codes map to one of a
small condition set (sunny, partly cloudy, cloudy, rain, storm, snow, fog) with a matching CSS icon.

---

## 3. Proposed structure (small and flat on purpose)

```
src/
  constants.ts        # every constant: API URLs, keys, storage keys, limits, debounce, defaults, messages
  utils.ts            # debounce, storage (safe), °C/°F, dates, range %, condition/icon, cn
  types.ts            # City, CurrentWeather, ForecastDay, Settings, Favourite
  api.ts              # axios instance + interceptors + search/weather calls + fallback + error mapping
  App.tsx             # state, effects, handlers, layout composition
  index.css           # Tailwind v4 import + @theme tokens + few base styles
  components/
    Sidebar.tsx       # brand, favourites panel, reminder card
    SearchBar.tsx     # input, suggestions, validation message
    CurrentWeather.tsx# city, save button, big temperature, condition
    StatsCard.tsx     # humidity / wind / high / low
    ForecastList.tsx  # 5-day rows + temperature range bars
    Banners.tsx       # loading, error, offline, no-results, preview-states bar
  sw.ts               # service worker (caching + notification)
public/
  icons/              # 192, 512, maskable icons
```

No Redux, no router, no per-feature folders. `App.tsx` owns state; components receive props.

---

## 4. Steps

Each step ends with: `npm run lint`, `npm run build`, a manual check at 375 / 768 / 1280, and a review gate.

### Step 1 — Foundation & design tokens
- Install and configure: `tailwindcss` + `@tailwindcss/vite` (v4, CSS-first), `axios`, `vite-plugin-pwa`, `lucide-react`.
- Remove the Vite demo UI, delete unused assets/styles.
- `index.css`: Tailwind import, `@theme` with colours/spacing/fonts measured from the screenshot, base styles, dark variant.
- Add fonts: **Instrument Serif** (display temperature/city) and **Inter** (UI).
- Create `constants.ts`, `utils.ts`, `types.ts` skeletons and `.env.example`.
- Set page title, favicon, meta theme-color, base `index.html`.
- **Done:** clean dev server, Tailwind utility visibly applied, no leftover demo files.

### Step 2 — Static UI shell (desktop first)
- Build the full layout with mock data: sidebar (brand, “Favourites 0 of 5” empty state, reminder card), header
  (search, °C/°F toggle, theme toggle), current weather block, stats card, “Next 5 days” list with range bars.
- Match the screenshot: spacing, borders, radii, serif display, muted greys, orange sun accent.
- Keep all interactions non-functional but focusable.
- **Done:** desktop screenshot comparison looks right; no logic yet.

### Step 3 — Responsive UI + every visual state
- 375 px: sidebar becomes a top drawer/section, stacked cards, 44×44 px controls; 768 px tablet layout.
- Add loading skeleton, fetch-error card, no-results, API-error, and offline banner components.
- Add the **Preview states** bar (Offline / Loading / Fetch error / Blocked notifications) driven by a local
  `preview` state, so reviewers can see each state instantly.
- **Done:** no horizontal scroll at 375/768/1280; every state reachable and readable; keyboard focus visible.

### Step 4 — API layer
- `api.ts`: Axios instance + interceptors (RapidAPI headers, normalise errors into `{ message, kind }`).
- Implement `searchCities(query, signal)` (GeoDB → Open-Meteo fallback) and `getWeather(city, unit?)`
  (OpenWeatherMap → Open-Meteo fallback), with response mapping into `types.ts`.
- Cache the last successful city weather in localStorage (written here, surfaced in Step 8).
- **Done:** temporary console/dev panel proves real data from both providers; failures produce friendly messages,
  no raw errors reach the UI.

### Step 5 — Search, autocomplete & validation
- Debounce input by **300 ms**; cancel stale requests with `AbortSignal`.
- Suggestions dropdown: mouse + arrow/Enter/Escape, highlighted match, loading row, no-results row, error row.
- Validate on **blur** and submit: empty field, city not selected, no results, network failure — specific inline text.
- On select: fetch weather, show loading skeleton, then render; update URL-free state and “last city”.
- **Done:** typing “Kar” returns Karachi within 300 ms; every failure path shows a precise message and a retry.

### Step 6 — Forecast + favourites
- 5-day list from real daily min/max; range bar position/width computed from the 5-day window via a util.
- Favourites: save/remove (max 5, star state, counter “n of 5”), quick-access panel loads that city, remove asks
  for confirmation, storage errors fall back to in-memory with a subtle notice.
- **Done:** favourites survive reload; 6th save blocked with an explanation; removal confirms; corrupt storage
  does not crash.

### Step 7 — Preferences & bonus polish
- °C/°F toggle persisted, converts instantly without refetch/reload.
- Dark/light toggle with system preference as default, persisted; verified contrast in both themes.
- Light CSS animation on the condition icon + subtle card transitions; respect `prefers-reduced-motion`.
- **Done:** unit + theme survive reload and match system on first load.

### Step 8 — Local storage & offline mode
- `utils.ts`: safe storage wrapper (try/catch, memory fallback) and cached-weather helpers.
- On load: render cached last city immediately, then refresh when online; show “Updated <time>” and a stale hint.
- Online/offline detection + banner; offline with no cache shows a clear empty state.
- **Done:** DevTools offline → last city still visible with banner; no crash when storage is blocked.

### Step 9 — PWA
- Manifest: name, short_name, description, `display: standalone`, `theme_color`, background, 192/512/maskable icons.
- `vite-plugin-pwa` with `injectManifest` and `src/sw.ts`: precache app shell, runtime-cache weather responses,
  navigation fallback, notification handling.
- Install prompt UI (small, dismissible) + “installed” detection.
- **Done:** Lighthouse installable; offline reload serves the shell and last cached city; icons valid.

### Step 10 — Daily reminder notification
- Reminder card: explanation text **before** the browser permission prompt, enable switch, time picker (default
  07:30), “send test notification” and permission status.
- `sw.ts`: `notificationclick` focuses/opens the app; schedule the next reminder while the service worker is alive.
- Blocked/unsupported states render inline without breaking anything; permission denial reverts the toggle.
- **Done:** test notification appears; enabling stores the time; blocked state shows the fallback message.
- **Honest limitation (documented in README):** client-only apps cannot guarantee delivery when the browser is
  fully closed — reliable delivery needs a push server. The service worker handles “tab closed, browser open”
  on a best-effort basis, and the app catches up on next open.

### Step 11 — Docs, audit & deploy
- README: setup, env keys, architecture decisions, APIs used, known limitations, live URL.
- Final PROMPTS.md pass; `lint` + `build`; accessibility/keyboard/responsive audit at 375/768/1280.
- Deploy (Vercel or Netlify) and verify install + offline on the deployed URL.
- **Done:** submission-ready repo + live URL.

---

## 5. Risks / decisions to confirm during review

1. **API keys** — do you have OpenWeatherMap and GeoDB (RapidAPI) keys? Without them the app runs keyless on
   Open-Meteo (fully working, just a different data source).
2. **Reminder honesty** — exact delivery with the browser fully closed is impossible without a backend; the plan
   implements the strongest client-only version and documents the gap. Acceptable?
3. **Scope of “Preview states”** — keep it visible to reviewers (as in the screenshot) or hide behind a dev flag?
4. **Deploy target** — Vercel or Netlify (both fine; Vercel is the default recommendation).

---

## 6. What I need from you

Review the step order and the four decisions above. On approval I start **Step 1** and stop for review before Step 2.
