# Partiet Sentrum Medlemsportal

## Project Overview

Member portal for Norwegian political party "Partiet Sentrum" (PS) and its youth organization "Unge Sentrum" (US). Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, and Supabase.

The UI is in Norwegian. Comments in the codebase are also primarily in Norwegian.

## Tech Stack

- **Framework:** Next.js 16 with App Router (React 19)
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 3.4 with CSS custom properties for theming
- **Database/Auth:** Supabase (PostgreSQL + Auth)
- **Email:** Resend
- **PDF:** @react-pdf/renderer, pdf-lib
- **Charts:** Recharts
- **Notifications:** Sonner (toast)
- **Icons:** Lucide React
- **Deployment:** Netlify

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

## Project Structure

```
app/                        # Next.js App Router
├── api/calendar/           # API routes (iCal endpoint)
├── arrangement/[id]/       # Public event detail pages
├── auth/update-password/   # Password update flow
├── bli-medlem/             # Membership signup (public)
├── dashboard/              # Admin dashboard (protected)
│   ├── actions.ts          # Server actions for dashboard
│   ├── event/[id]/         # Event management (edit, participants, polls)
│   ├── settings/           # Settings, CSV import, role management
│   └── tabs/               # Dashboard tab views (economy, resources, etc.)
├── login/                  # Login page + password reset
├── minside/                # Member "my page" (protected)
│   └── event/[id]/         # Member event view + voting
├── takk/                   # Post-signup confirmation
├── layout.tsx              # Root layout (Geist fonts, Sonner toaster)
└── page.tsx                # Homepage (split-screen PS/US hero)

components/
├── ui/                     # Reusable UI: button, card, dialog, badge, etc.
├── dashboard/              # Dashboard-specific: sidebar, stats cards
├── pdf/                    # PDF membership certificate templates
├── PostalCodeLookup.tsx    # Norwegian postal code → municipality lookup
└── share-buttons.tsx       # Social sharing buttons

utils/supabase/
├── server.ts               # Server-side Supabase client (uses cookies)
├── client.ts               # Browser-side Supabase client
└── admin.ts                # Admin client (uses SUPABASE_SERVICE_ROLE_KEY)
```

## Key Patterns

### Supabase Clients

Three Supabase client patterns — always use the correct one:

- **Server components/actions:** `import { createClient } from '@/utils/supabase/server'` — async, uses cookies
- **Client components:** `import { createClient } from '@/utils/supabase/client'` — browser client
- **Admin operations:** `import { createAdminClient } from '@/utils/supabase/admin'` — service role key, bypasses RLS

### Server Actions

Server actions live in `actions.ts` files co-located with their pages (e.g., `app/dashboard/actions.ts`, `app/login/actions.ts`). They use `'use server'` directive and are bound to forms via `formAction`.

### Component Organization

- Server Components are the default. Client Components use `'use client'` directive.
- Complex pages use a Server Component shell that wraps Client Components in `<Suspense>`.
- Client-interactive components are typically suffixed with `-client` (e.g., `bli-medlem-client.tsx`).

### Path Aliases

`@/*` maps to the project root (configured in `tsconfig.json`).

## Theming & Colors

Two brand themes defined as CSS custom properties in `globals.css` and extended in `tailwind.config.js`:

| Token | Tailwind Class | Color |
|-------|---------------|-------|
| PS Primary | `text-ps-primary`, `bg-ps-primary` | #c93960 (red/pink) |
| PS Dark | `text-ps-dark`, `bg-ps-dark` | darker red |
| PS Text | `text-ps-text` | dark purple-brown |
| US Primary | `text-us-primary`, `bg-us-primary` | #8b5cf6 (purple) |
| US Dark | `text-us-dark`, `bg-us-dark` | darker purple |
| Background | `bg-background` | #fffcf1 (cream) |
| Surface | `bg-surface` | white |

Colors use RGB triplets in CSS variables with Tailwind's alpha syntax: `rgb(var(--ps-primary) / <alpha-value>)`.

## Environment Variables

Required environment variables (never commit these):

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)
- Resend API key (for email)

## Coding Conventions

- Norwegian language for UI text, comments, route paths, and variable names
- Tailwind utility classes for all styling (no CSS modules)
- Rounded corners (`rounded-xl`, `rounded-2xl`) and soft shadows for card-like UI
- `<Button>` component from `@/components/ui/button` — supports `variant` prop
- `<Card>`, `<CardContent>` from `@/components/ui/card` for container styling
- `<Badge>` from `@/components/ui/badge` for labels and tags
- Sonner `toast()` for user notifications
- Font: Geist Sans + Geist Mono (Google Fonts via next/font)
- PWA-enabled with manifest and mobile icons
