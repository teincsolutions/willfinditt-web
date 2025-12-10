
# Willfind8 Web Frontend Development Prompt (Next.js + Tailwind + TypeScript)

## Overview
Build the **Willfind8** public web frontend using **Next.js (App Router)** + **TypeScript** + **TailwindCSS**. The web app must reproduce the product experience seen in the provided mobile screenshots (mobile-first) and integrate with the existing backend API (Postman collection at `https://documenter.getpostman.com/view/11355048/2sB3HtFciW`). **No backend development is required**.

Key libraries:
- axios
- @tanstack/react-query
- react-hook-form + yup (validation)
- next/image
- clsx, date-fns (optional)
- eslint + prettier

Target: responsive desktop + mobile web, SEO-ready, production-ready codebase.

---

## Project Setup & Requirements

### Initial scaffold
- Use `create-next-app@latest --typescript` with **App Router**.
- Add Tailwind via official setup; include `tailwind.config.js`.
- Add packages:
  ```bash
  npm i axios @tanstack/react-query react-hook-form @hookform/resolvers yup clsx date-fns
  npm i -D eslint prettier eslint-config-next
  ```

### Repo structure
```
/src
  /app                # Next.js app routes
  /components         # UI components only
  /layouts            # Header, Footer, etc.
  /hooks              # React Query hooks + small UI hooks
  /services           # axios instance + API service modules
  /types              # TS types/interfaces for API responses
  /utils              # helpers: formatters, pagination
  /lib                # auth helpers (token store)
  /styles             # global css + tailwind base
/public
tailwind.config.js
next.config.js
.env.local.example
README.md
```

---

## Pages to Implement
- `/` — Home (category tiles, search box, trending, listing grid)
- `/search` — Search results with filters & pagination
- `/category/[slug]` — Category listing with **left filters sidebar**
- `/ad/[id]` — Ad detail (carousel, price, seller info, related ads)
- `/favorites` — Saved ads list
- `/ads/new` — Create New Ad (multi-section form)
- `/messages` — Messages list & `/messages/[threadId]` chat view
- `/account` — Account overview and nested routes
- `/auth/login`, `/auth/register`
- `/terms`, `/about`, `/contact`
- `404`, `500` pages

---

## Components
- `Header`, `Footer`, `SearchBar`
- `CategoryTile`, `ListingCard`
- `FiltersSidebar`, `Pagination`
- `AdCarousel`, `ImageUploader`
- `Modal`, `Toast`, `Button`, `Icon`
- `ChatListItem`, `ChatWindow`
- `ProfileCard`, `StatsCard`

**Rule:** Components = UI only. Hooks/services handle logic.

---

## Services & API Integration (axios)
- BaseURL from `NEXT_PUBLIC_API_URL`
- Attach `Authorization` header before each request
- On 401 → call refresh token endpoint → retry once → if fails, clear session and redirect to `/auth/login`

### Service modules
- `auth.service.ts` — login, register, logout, refresh, me
- `ads.service.ts` — listAds, getAd, createAd, updateAd, deleteAd
- `categories.service.ts` — listCategories, getCategory
- `users.service.ts` — profile, favorites
- `messages.service.ts` — threads, sendMessage

---

## State Management (TanStack Query)
Hooks to be implemented:
- `useAds` (pagination & infinite scroll)
- `useAd`
- `useCreateAd`
- `useAuth` (login/logout/me)
- `useFavorites`
- `useMessages`
- `useCategories`

---

## Pagination
- Server-side pagination
- Page numbers on desktop
- Infinite scroll + “Load more” on mobile
- Display total results and current range

---

## Create Ad Flow
Form with `react-hook-form` + `yup` validation:
1. Category selection
2. Image uploads (max 5)
3. Title, description, condition, features
4. Price, negotiable toggle
5. Contact info (auto-fill), location
6. Submit → show success toast

---

## Auth & Token Refresh
1. Login → store `accessToken` and `refreshToken`
2. Axios interceptor:
   - On 401, attempt token refresh
   - If refresh fails → clear session, redirect to `/auth/login`
3. Logout → clear tokens + query cache
4. Google OAuth → redirect flow

---

## SEO & Metadata
- `<Head>` tags per page (title, description, canonical)
- Open Graph & Twitter tags
- JSON-LD schema on ad pages
- Sitemap & robots.txt

---

## Environment Variables
```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_DEFAULT_PER_PAGE=12
```

---

## Acceptance Criteria
- All pages responsive (match mobile app visually)
- API integration via `services/*` and TanStack Query hooks
- Pagination and filters work
- Create Ad flow functional (uploads, validation)
- Auth & token refresh logic correct
- SEO tags and OG previews added
- Linting/formatting pass
- Build runs without errors
