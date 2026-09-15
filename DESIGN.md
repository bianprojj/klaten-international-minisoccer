# Klaten Minisoccer — Style Reference (Restyle)
> Pitch-side energy, in club colors

**Theme:** light
**Project:** Klaten Minisoccer booking & payment platform (Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase, Midtrans Snap)

---

## Redesign Scope — Read This Before Touching Any Code

This document is a **visual restyle spec only**. The goal is to replace the current look and feel with the tokens and components below — nothing about how the app works should change.

### Allowed (UI/visual layer only)
- Colors — backgrounds, text, borders, button fills, badges, shadows
- Typography — font families, sizes, weights, line-height, letter-spacing
- Spacing and layout rhythm — padding, margins, gaps, section rhythm
- Shape — border-radius, card shapes, dividers
- Decoration — shadows, glows, borders, image treatment
- Sizing of interactive elements — button/input height, padding, icon size
- Tailwind config values, CSS custom properties, className/style props on existing components

### Not allowed — leave untouched
- Business logic: booking rules, price calculation, availability checks, validation
- API calls, Supabase queries, Midtrans/Fonnte integration code, data fetching, state management
- Routing, page structure, component props, function signatures, file/folder layout
- The number, order, or fields of any step in the booking or payment flow
- Copy and functional text (labels, confirmations, error messages) — restyle their font/color only, don't rewrite the words
- Any backend endpoint, database schema, or environment/config values

If a component needs a structural DOM change purely to support the new look (e.g. wrapping a button in a span for an icon), that's fine — but the component's behavior, handlers, and data must stay identical. When in doubt, restyle the `className`/CSS, not the JSX logic or the `.ts`/`.tsx` logic blocks.

---

Klaten Minisoccer moves away from the previous dark, generic admin-panel look toward something that reads like the venue itself: a well-kept pitch under floodlights. The base canvas is a warm **Bone White** — closer to chalk or a clean scoreboard than clinical white — so the interface feels inviting rather than corporate. **Green Field**, a deep pitch-green, carries the structural weight: footer, hero overlay, and any full-bleed dark band. **Neon Green** is spent carefully, on exactly one thing per screen — the action that moves someone toward a confirmed, paid booking. **Navy Blue** does the quiet work of reading text and giving small UI elements definition. Nothing else competes for attention.

## Tokens — Colors

| Name | Hex | RGB | CMYK | Token | Role |
|------|-----|-----|------|-------|------|
| Bone White | `#F1EED9` | 241, 238, 217 | 5, 3, 15, 0 | `--color-bone-canvas` | Page background, hero base, default section canvas |
| Pure White | `#FFFFFF` | 255, 255, 255 | 0, 0, 0, 0 | `--color-pure-white` | Elevated cards, inputs, nav bar, text on Green Field |
| Green Field | `#005136` | 0, 81, 54 | 90, 41, 84, 42 | `--color-field-deep` | Footer, hero overlay, dark section bands, secondary-button border/fill |
| Navy Blue | `#1A1F4D` | 26, 31, 77 | 100, 96, 39, 38 | `--color-navy-ink` | Primary text, headings, icons, focus outlines |
| Neon Green | `#C9D651` | 201, 214, 81 | 25, 2, 85, 0 | `--color-neon-action` | The single vivid accent — primary buttons, active states, highlights only |
| Navy Ink Muted | `rgba(26,31,77,0.62)` | — | — | `--color-navy-muted` | Secondary/helper text, placeholders, timestamps |
| Field Border | `rgba(0,81,54,0.16)` | — | — | `--color-field-border` | Hairline borders, dividers, input outlines on light surfaces |
| Neon Glow | `rgba(201,214,81,0.20)` | — | — | `--color-neon-glow` | Soft highlight behind a selected or active element (e.g. a chosen time slot) |

These four hex values are the client's fixed brand colors and should not be substituted or tinted beyond what's listed above. The muted/border/glow tokens are the same brand colors at reduced opacity, not new colors — this keeps the palette disciplined instead of drifting into an arbitrary gray or blue scale.

## Tokens — Typography

### Archivo — Display and heading typeface — grounded, condensed-leaning grotesque with real weight at 700–900. Used for anything a visitor reads as a statement: hero headline, section headings, card titles, price figures · `--font-heading`
- **Weights:** 700, 800, 900
- **Sizes:** 24px, 32px, 40px, 56px
- **Line height:** 1.05–1.25
- **Letter spacing:** −0.01em at 24px, −0.015em at 32px, −0.02em at 40px and 56px
- **Role:** Carries the athletic, scoreboard-adjacent energy of the brand. Heavier than a typical SaaS heading font on purpose — this is a sports venue, not a fintech dashboard.

### Manrope — Body and UI typeface — a warm, rounded-terminal grotesque that stays legible at small sizes for schedules, prices, and form fields · `--font-body`
- **Weights:** 400, 500, 600, 700
- **Sizes:** 12px, 14px, 16px, 18px, 20px
- **Line height:** 1.4–1.6
- **Letter spacing:** normal (0)
- **Role:** Handles navigation, body copy, buttons, inputs, badges, and every piece of functional text. Friendlier than a strictly geometric UI font, which suits a community venue booked by families and weekend teams.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Font | Weight | Token |
|------|------|-------------|-----------------|------|--------|-------|
| caption | 12px | 1.4 | 0 | Manrope | 500 | `--text-caption` |
| body-sm | 14px | 1.5 | 0 | Manrope | 400 | `--text-body-sm` |
| body | 16px | 1.6 | 0 | Manrope | 400 | `--text-body` |
| body-lg | 18px | 1.5 | 0 | Manrope | 400 | `--text-body-lg` |
| subheading | 20px | 1.4 | 0 | Manrope | 600 | `--text-subheading` |
| heading-sm | 24px | 1.25 | −0.01em | Archivo | 700 | `--text-heading-sm` |
| heading | 32px | 1.2 | −0.015em | Archivo | 800 | `--text-heading` |
| heading-lg | 40px | 1.15 | −0.02em | Archivo | 800 | `--text-heading-lg` |
| display | 56px | 1.05 | −0.02em | Archivo | 900 | `--text-display` |

Avoid all-caps treatment on labels or buttons — differentiate emphasis through the Archivo/Manrope pairing, weight, and color instead of letter-casing.

## Tokens — Spacing & Shapes

**Base unit:** 4px
**Density:** comfortable — tighter than the old spacious fintech rhythm, roomier than a dense dashboard

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 48 | 48px | `--spacing-48` |
| 64 | 64px | `--spacing-64` |
| 96 | 96px | `--spacing-96` |
| 128 | 128px | `--spacing-128` |

### Border Radius

| Element | Value |
|---------|-------|
| buttons | 14px |
| inputs | 12px |
| cards | 20px |
| badges / pills / nav | 999px |
| default | 8px |

### Elevation (Shadows)

| Name | Value | Token | Use |
|------|-------|-------|-----|
| card | `0 4px 16px rgba(26,31,77,0.08)` | `--shadow-card` | Default card lift off the Bone White canvas |
| elevated | `0 10px 28px rgba(26,31,77,0.14)` | `--shadow-elevated` | Hover/active card state, open dropdowns |
| neon-glow | `0 4px 14px rgba(201,214,81,0.35)` | `--shadow-neon-glow` | Primary CTA button, to make the single accent color feel lit rather than flat |

Shadows are tinted with Navy Blue (not generic black) so elevation reads as part of the brand rather than a default UI-kit shadow.

### Layout

- **Page max-width:** 1180px
- **Section gap:** 64px
- **Card padding:** 24px
- **Element gap:** 12px

## Components

### Primary CTA Button (Neon Green)
**Role:** The one vivid action per screen — "Booking Sekarang," "Bayar Sekarang," "Konfirmasi Booking"

Filled `#C9D651` Neon Green, `#1A1F4D` Navy Blue text (sentence case, not uppercase) at 16px Manrope weight 600, 14px border-radius, 14px vertical / 28px horizontal padding, no border, `--shadow-neon-glow` beneath it. Never pair two Neon Green buttons side by side on the same view — if a second action is needed, use the outline or ghost variant below.

### Secondary / Outline Button
**Role:** Meaningful but non-primary actions — "Ubah Jadwal," "Lihat Detail," "Batalkan"

Transparent background, 1.5px solid `#005136` Green Field border, Green Field text at 16px Manrope weight 500, 14px radius, 14px vertical / 28px horizontal padding. On hover, fills solid Green Field with Bone White text.

### Ghost / Text Button
**Role:** Low-emphasis inline actions — "Lihat semua jadwal," "Syarat & ketentuan"

No background, no border, Navy Blue text with an underline that appears on hover. Used inline within body copy or beside a heading, never as a standalone block CTA.

### Top Navigation Bar
**Role:** Primary site navigation

Full-width Bone White background, 1px bottom border in Field Border, sits flush at the top of the page (not floating). Logo mark on the left in Green Field, nav links (Beranda, Jadwal, Harga, Galeri, Kontak) centered in Navy Blue Manrope 500, Neon Green primary button on the right. On scroll, background becomes solid Pure White with `--shadow-card` beneath it — no blur effect needed since the base is already light.

### Content Card (Court / Package / Feature)
**Role:** Court listings, pricing packages, feature blocks

Pure White background, 20px radius, 24px padding, `--shadow-card` (hover: `--shadow-elevated`). A 4px Green Field accent bar along the top edge (inside the radius) ties every card back to the pitch-green identity without repeating a border on all four sides. Heading in Archivo 700 at 24px, Navy Blue; supporting line in Manrope 400 at 16px, Navy Ink Muted.

### Time Slot Selector
**Role:** Selectable time chip in the booking calendar — visual states only, selection logic untouched

- **Available (default):** Pure White fill, 1px Field Border, Navy Blue text, 12px radius
- **Selected:** Neon Green fill, Navy Blue text, no border, `--shadow-neon-glow`
- **Booked/unavailable:** Bone White fill at reduced opacity, Navy Ink Muted text, `cursor: not-allowed` — purely a style state, the underlying disabled logic stays as-is

### Status Badge
**Role:** Booking/payment status — "Tersedia," "Dipesan," "Menunggu Pembayaran," "Lunas"

999px pill, 4px vertical / 12px horizontal padding, 12px Manrope 600, sentence case (not all-caps):
- Tersedia → Neon Green background, Green Field text
- Menunggu Pembayaran → Bone White background, 1px Field Border, Navy Ink Muted text
- Lunas / Dipesan → Green Field background, Bone White text

### Hero Section
**Role:** Above-the-fold introduction to the venue

Full-bleed photograph of the actual court in use (match or training, not a stock/abstract image), with a Green Field gradient overlay running from solid at the top to transparent toward the middle, keeping headline text legible without hiding the photo. Headline in Archivo 900 at 56px, Bone White. Subtext in Manrope 400 at 18px, Bone White at 90% opacity. Primary CTA (Neon Green) and a ghost/outline button (Bone White border) sit side by side beneath the subtext.

### Footer / Disclaimer Strip
**Role:** Footer and legal/info strip

Full-width Green Field background, Bone White text at 14px Manrope 400 for venue info and links, and Bone White at 70% opacity for the fine-print disclaimer line at 12px.

### Section Container
**Role:** Horizontal wrapper between hero and footer

Full-width Bone White canvas, inner content constrained to 1180px max-width, 64px vertical padding. Holds 2- or 3-column grids of Content Cards or text/image splits.

## Do's and Don'ts

### Do
- Reserve Neon Green for exactly one primary action per screen
- Put Bone White or Pure White text on Green Field backgrounds — never Navy Blue on Green Field, the contrast is too low
- Use Archivo for anything read as a heading or statement, Manrope for everything functional
- Keep card, button, and input radii distinct (20px / 14px / 12px) rather than using one radius everywhere
- Tint shadows with Navy Blue, not generic black, so elevation stays on-brand
- Touch only styling — Tailwind classes, CSS variables, inline style props — when applying this spec to existing components

### Don't
- Don't introduce any color outside the four brand colors and their opacity variants listed above
- Don't use Neon Green as a large background fill — it's an accent, not a canvas color
- Don't set button or badge text in all-caps; use weight and color for emphasis instead
- Don't change a component's handlers, validation, API calls, or props while restyling it
- Don't alter the order, count, or fields of any step in the booking or payment flow
- Don't rewrite functional copy (confirmations, errors, labels) — only its font, size, and color

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Bone Canvas | `#F1EED9` | Base page background |
| 1 | Pure White Surface | `#FFFFFF` | Cards, inputs, nav bar |
| 2 | Green Field Surface | `#005136` | Footer, hero overlay, full-bleed dark bands |

## Imagery

Real photography of the venue and matches — turf texture, floodlit night games, players mid-action — takes priority over stock or abstract imagery, since the venue itself is the most distinctive asset. Treat photos with a slight cool-to-neutral grade (avoid warming filters that fight the Bone White canvas) and a Green Field gradient overlay only where text needs to sit on top. Icons throughout the UI are a minimal line style in Navy Blue, switching to Bone White when placed on Green Field surfaces.

## Layout

Light Bone White canvas throughout, with Green Field reserved for the hero overlay and footer as the only full-bleed dark bands. Hero is full-bleed photographic with a centered or left-aligned headline/subtext/CTA stack. Below the hero, content sits in 1180px-max-width sections with 64px vertical padding, alternating 2-column text/image splits and 3-column card grids for courts, packages, and schedule information. Navigation is a standard top bar, not floating, becoming a solid Pure White surface with a shadow once the page scrolls past the hero.

## Agent Prompt Guide

**Quick Color Reference**
- Canvas: `#F1EED9` Bone White
- Card/surface: `#FFFFFF` Pure White
- Dark structural surface: `#005136` Green Field
- Primary text: `#1A1F4D` Navy Blue
- Primary action (accent): `#C9D651` Neon Green

**Example Component Prompts**

1. Restyle a court/package card: background `#FFFFFF`, 20px radius, 24px padding, shadow `0 4px 16px rgba(26,31,77,0.08)`, with a 4px `#005136` accent bar along the top inside the radius. Heading in Archivo 700 at 24px, color `#1A1F4D`. Body text in Manrope 400 at 16px, color `#1A1F4D`. Do not change the card's data or click behavior — style only.

2. Restyle the primary CTA button: background `#C9D651`, text color `#1A1F4D` at 16px Manrope 600, 14px radius, no border, shadow `0 4px 14px rgba(201,214,81,0.35)`, 14px vertical / 28px horizontal padding. Keep the existing onClick handler and label text unchanged.

3. Restyle the outline/secondary button: transparent background, 1.5px solid `#005136` border, `#005136` text at 16px Manrope 500, 14px radius, 14px vertical / 28px horizontal padding.

4. Restyle the hero section: full-bleed photographic background (existing venue photo), Green Field gradient overlay top-to-transparent, headline in Archivo 900 at 56px, color `#F1EED9`, subtext in Manrope 400 at 18px, color `#F1EED9` at 90% opacity.

5. Restyle a time-slot button: default state `#FFFFFF` background, 1px `rgba(0,81,54,0.16)` border, `#1A1F4D` text, 12px radius. Selected state: `#C9D651` background, `#1A1F4D` text, no border, glow shadow. Booked/disabled state: reduced-opacity `#F1EED9` background, muted Navy text — visual only, the disabled logic itself must not change.

## Typography Philosophy

Archivo and Manrope split the work cleanly: Archivo's grotesque weight and slight condensation give headlines and prices the punch of a scoreboard or team crest, while Manrope keeps every functional surface — nav, forms, buttons, schedules — warm and easy to scan at a glance. The pairing is deliberately heavier and friendlier than the previous fintech-style intermediate-weight system; a sports venue booked by weekend teams and families should feel closer to a well-run club than a banking app.

## References for Aesthetic Direction

Football/sport-first brands that lean into deep pitch-green plus one vivid accent — rather than generic SaaS blue — are the closest aesthetic cousins here: think club crest branding, matchday ticket design, and scoreboard typography rather than dashboard UI kits. Use these as a feeling to aim for, not a literal template to copy.

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-bone-canvas: #F1EED9;
  --color-pure-white: #FFFFFF;
  --color-field-deep: #005136;
  --color-navy-ink: #1A1F4D;
  --color-neon-action: #C9D651;
  --color-navy-muted: rgba(26, 31, 77, 0.62);
  --color-field-border: rgba(0, 81, 54, 0.16);
  --color-neon-glow: rgba(201, 214, 81, 0.20);

  /* Typography — Font Families */
  --font-heading: 'Archivo', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-body: 'Manrope', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-caption: 12px;
  --leading-caption: 1.4;
  --text-body-sm: 14px;
  --leading-body-sm: 1.5;
  --text-body: 16px;
  --leading-body: 1.6;
  --text-body-lg: 18px;
  --leading-body-lg: 1.5;
  --text-subheading: 20px;
  --leading-subheading: 1.4;
  --text-heading-sm: 24px;
  --leading-heading-sm: 1.25;
  --tracking-heading-sm: -0.01em;
  --text-heading: 32px;
  --leading-heading: 1.2;
  --tracking-heading: -0.015em;
  --text-heading-lg: 40px;
  --leading-heading-lg: 1.15;
  --tracking-heading-lg: -0.02em;
  --text-display: 56px;
  --leading-display: 1.05;
  --tracking-display: -0.02em;

  /* Typography — Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  --font-weight-black: 900;

  /* Spacing */
  --spacing-unit: 4px;
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-96: 96px;
  --spacing-128: 128px;

  /* Layout */
  --page-max-width: 1180px;
  --section-gap: 64px;
  --card-padding: 24px;
  --element-gap: 12px;

  /* Border Radius */
  --radius-default: 8px;
  --radius-inputs: 12px;
  --radius-buttons: 14px;
  --radius-cards: 20px;
  --radius-pill: 999px;

  /* Shadows */
  --shadow-card: 0 4px 16px rgba(26, 31, 77, 0.08);
  --shadow-elevated: 0 10px 28px rgba(26, 31, 77, 0.14);
  --shadow-neon-glow: 0 4px 14px rgba(201, 214, 81, 0.35);

  /* Surfaces */
  --surface-bone-canvas: #F1EED9;
  --surface-pure-white: #FFFFFF;
  --surface-field-deep: #005136;
}
```

### Tailwind v4

```css
@theme {
  /* Colors */
  --color-bone-canvas: #F1EED9;
  --color-pure-white: #FFFFFF;
  --color-field-deep: #005136;
  --color-navy-ink: #1A1F4D;
  --color-neon-action: #C9D651;
  --color-navy-muted: rgba(26, 31, 77, 0.62);
  --color-field-border: rgba(0, 81, 54, 0.16);
  --color-neon-glow: rgba(201, 214, 81, 0.20);

  /* Typography */
  --font-heading: 'Archivo', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-body: 'Manrope', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-caption: 12px;
  --text-body-sm: 14px;
  --text-body: 16px;
  --text-body-lg: 18px;
  --text-subheading: 20px;
  --text-heading-sm: 24px;
  --text-heading: 32px;
  --text-heading-lg: 40px;
  --text-display: 56px;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-96: 96px;
  --spacing-128: 128px;

  /* Border Radius */
  --radius-default: 8px;
  --radius-inputs: 12px;
  --radius-buttons: 14px;
  --radius-cards: 20px;
  --radius-pill: 999px;
}
```

---

**Reminder for whoever (or whatever) implements this:** this file changes what things look like, not what they do. If applying a token here would require touching a `.ts` file's logic, a hook, an API route, or Supabase/Midtrans/Fonnte code, stop and leave that part alone.
