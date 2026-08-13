# ParkSmart — React + Vite

This is a full React + Vite conversion of the original vanilla HTML/CSS/JS ParkSmart
prototype. Every screen, feature, and pixel of styling was ported 1:1 — nothing was
redesigned, removed, or restructured. All original CSS files are included unmodified
in `src/styles/`.

## Run it

```bash
npm install
npm run dev
```

Then open the printed `http://localhost:5173` URL.

Other scripts:
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## What changed vs. the original

Nothing visual or behavioral. What changed is *how* it's built:

| Original | React version |
|---|---|
| `js/data.js` | `src/data/constants.js` |
| `js/theme.js` | theme state in `src/context/AppContext.jsx` |
| `js/ui.js` (toast) | `src/components/Toast.jsx` |
| `js/navigation.js` | screen/tab state in `AppContext` + `src/components/BottomNav.jsx` |
| `js/auth.js` | auth actions in `AppContext` + `src/screens/Login.jsx`, `Signup.jsx`, `Otp.jsx` |
| `js/home.js` | `src/tabs/Home.jsx` + `src/utils/predict.js` |
| `js/booking.js` | `src/tabs/Book.jsx` + `src/modals/BookModal.jsx` + `src/modals/PayModal.jsx` |
| `js/mybookings.js` | `src/tabs/MyBookings.jsx` |
| `js/main.js` | `src/hooks/useClock.js` + `src/hooks/useLiveAvailability.js` |
| direct DOM manipulation (`getElementById`, `innerHTML`) | React state + JSX rendering |
| `localStorage` reads/writes scattered across files | centralized in `AppContext.jsx`, same `ps_user` / `ps_bk` / `ps_theme` keys |

The app still uses **plain CSS** (no Tailwind/Bootstrap/MUI) and **no extra
libraries** (no router, no state management library) — the original project used
none of these, and none were added, per the "don't change UI/UX or add unused
dependencies" requirement. `package.json` only lists what the code actually
imports: `react` and `react-dom`.
