# Stitch Redesign — Applied Design System

The Stitch export (`DESIGN.md` + `code.html` + `screen.png`, "Modern / Corporate")
has been applied to ReleaseTrace, replacing the previous dark
Obsidian/Graphite engineering theme with the light Stitch system.

## Tokens (source: Stitch DESIGN.md)

| Role | Stitch value | Where it lives |
| --- | --- | --- |
| Background / surface | `#faf9f9` | `canvas`, `--canvas` |
| Card surface | `#ffffff` (surface-container-lowest) | `surface.DEFAULT` |
| Inset / chip surface | `#f4f3f3` (surface-container-low) | `surface.elevated` / `surface.subtle` |
| Borders | `#e3e2e2` (surface-container-highest) | `surface.border` |
| Primary | `#426164`, container `#5a7a7d` | `signal`, `primary` |
| Text primary | `#1a1c1c` (on-surface) | `text.primary` |
| Text secondary | `#414849` (on-surface-variant) | `text.secondary` |
| Text muted | `#717879` (outline) | `text.muted` |
| Error / critical | `#ba1a1a` | `risk.critical` |
| Brand tint | `#f0f5f6` | `brand.subtle` |

Two deliberate adjustments for readability on light backgrounds:
healthy/verified green is deepened to `#3e7c59` and warning to `#b45309`
(the raw Stitch sage/amber are tint colours, not text colours).

## Typography

- Sans: **Inter** (300–700) — Stitch headline/body/label scale
- Mono: **JetBrains Mono** (400–600) — technical labels, pills, table data
- Loaded via `next/font/google` in `src/app/layout.tsx`
  (variables `--font-sans` / `--font-mono`)

## Shape & elevation

- Radius scale: sm `0.375rem`, DEFAULT `0.5rem`, md `0.75rem`, lg `1rem`, xl `1.5rem`
- Shadows are soft and diffused (`panel-subtle`, `panel-elevated`)

## Shell changes (`AppLayout`)

- Frosted light header (`bg-surface/90 backdrop-blur`), soft 1px shadow
- Project selector and status indicators are now pills
  (HINDSIGHT: RETAINED in a sage pill, NEON: POOLED, notification bell, avatar)
- Sidebar: white, active item sits on the brand tint with a teal label
- **Mobile bottom tab bar** from the Stitch mock:
  Overview / Deploys / Memories / Settings, with safe-area padding;
  main content gets bottom padding on mobile so nothing hides behind it

## Dashboard changes (`src/app/dashboard/page.tsx`)

Restyled to match the Stitch mock card-for-card: 2×2 telemetry grid with
pill tags, the critical interception as a red-tinted hero card with a red
top bar and white evidence boxes, the Deployment Register as a white
table card, recurring failure categories as stacked white cards with
impact pills, and the Hindsight Memory Bank as a teal-tint card.

## Scope note

All other pages (Deployments, Memories, Learning Lab, Integrations,
Settings) inherit the new system automatically because they are built on
the same token classes (`bg-surface`, `text-text-primary`,
`border-surface-border`, `text-signal`, …) — the token values changed,
not the class names. Modal scrims were lightened from `bg-black/70` to a
40% on-surface overlay to match.
