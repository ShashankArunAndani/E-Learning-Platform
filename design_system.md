# Visual Design System — E-Learning Platform

The design direction here is built around one idea: **your product's real value is the certificate at the end.** Cart, checkout, progress bars — all of that exists to get someone to a credential they can put on LinkedIn. So the design should feel less like a generic SaaS dashboard and more like a place that issues something worth earning: restrained, credible, a little bit "institutional" in the good sense — think a well-designed university admissions page or a law firm's site, not a startup landing page.

---

## Why not the "default AI look"

Two patterns show up constantly in generated designs and would undercut the premium feel you want:
- Warm cream background + terracotta accent + generic sans-serif — reads as templated now, not premium.
- Identical rounded SaaS cards with the same soft grey shadow on everything — flattens hierarchy, feels like a free template.

This system deliberately avoids both.

---

## 1. Color Palette

| Token | Hex | Role |
|---|---|---|
| `--ink-navy` | `#101C36` | Primary dark — nav bar, footer, hero background, headings on light sections |
| `--deep-indigo` | `#1B2A4A` | Secondary dark — card backgrounds on dark sections, hover states |
| `--parchment` | `#FAF7F1` | Primary light background — main page background |
| `--gold` | `#C89B3C` | Premium accent — used **sparingly**: CTA highlights, certificate seals, "premium/verified" badges |
| `--verdant` | `#2F6F62` | Secondary accent — progress bars, success states, completion indicators |
| `--charcoal` | `#23262B` | Body text color (not pure black — softer, easier to read at length) |

**Rationale:** navy reads as trust and academic credibility (the color of university crests and diplomas). Gold is reserved *only* for moments of achievement — certificate elements, a "top rated" badge, a completed progress ring — so it stays meaningful instead of becoming wallpaper. Teal carries the "growth/progress" meaning without defaulting to the generic edtech blue-on-blue look. Parchment is warm without tipping into the cliché AI cream.

**Usage discipline:** gold should appear on maybe 2–3 elements per screen, max. If it's everywhere, it stops meaning "special."

---

## 2. Typography

| Role | Typeface | Notes |
|---|---|---|
| Display / Headings | **Source Serif 4** | Book-like, scholarly, distinguished — use for hero headline, course titles, certificate text. Weight 600–700 for headlines. |
| UI / Body / Forms | **Inter** | High legibility at small sizes — needed for dashboards, tables, forms, nav. Weight 400 body, 500–600 for labels/buttons. |

Two families, clearly distinct roles — serif carries *meaning and authority*, sans carries *function and clarity*. Don't use the serif for buttons, form labels, or table data; don't use the sans for the hero headline or the certificate itself.

**Type scale** (rem, assuming 16px base):
```
Display / Hero H1     : 3.5rem  / 1.1 line-height / 600 weight
Section H2            : 2.25rem / 1.2
Card / Subsection H3  : 1.375rem / 1.3
Body                  : 1rem    / 1.6 line-height
Small / meta text     : 0.875rem / 1.5
```
Keep body text line length under ~75 characters — wide unbroken paragraphs read as a wall of text and undercut the "considered" feel.

**Avoid:** all-caps labels, italicizing single words in headlines for "emphasis," tracked-out eyebrow labels above every section header (e.g., "OUR COURSES" in small caps) — these are the most common generated-design tells and will make it look templated rather than designed.

---

## 3. Layout Concept

**Hero:** left-aligned, not centered. Headline + subtext on the left (roughly 55% width), and on the right — instead of a generic illustration — a mockup of an actual certificate with a gold seal. This makes the product's real payoff the first thing a visitor sees, rather than a stock "team collaborating" illustration.

```
┌────────────────────────────────────────────┐
│  [nav: logo    courses  about    login]     │
├────────────────────────────────────────────┤
│  Learn something                 ┌────────┐ │
│  that actually                   │ cert   │ │
│  counts.                         │ mockup │ │
│                                   │ w/ gold│ │
│  [subtext, 2 lines]               │ seal   │ │
│  [Browse Courses →]              └────────┘ │
└────────────────────────────────────────────┘
```

**Course cards:** vary hierarchy instead of identical rounded boxes — the course thumbnail/title should dominate, price and rating are secondary and smaller, category is a plain text label (not a pill/badge on every single card — reserve badges for "Bestseller"/"New" so they mean something).

**Dashboard/checkout pages:** left-aligned, generous whitespace, single accent color per screen (don't mix gold and teal freely — pick teal for progress-oriented screens like "My Courses," gold for achievement/certificate screens, navy/neutral for transactional screens like cart and checkout).

**Certificate page itself:** this is your signature moment — spend the most design effort here. Serif typography, a thin gold border or seal graphic, the learner's name prominent, verifiable URL/QR code small and unobtrusive at the bottom. This page is what a student will screenshot and post on LinkedIn — treat it like the actual product.

---

## 4. CSS Foundation

Drop this into your base stylesheet (`/public/css/tokens.css`) and reference these variables everywhere rather than hardcoding colors:

```css
:root {
  /* Colors */
  --ink-navy: #101C36;
  --deep-indigo: #1B2A4A;
  --parchment: #FAF7F1;
  --gold: #C89B3C;
  --verdant: #2F6F62;
  --charcoal: #23262B;

  /* Neutral scale for borders/dividers */
  --border-subtle: #E4DFD4;
  --text-muted: #6B6F76;

  /* Typography */
  --font-display: 'Source Serif 4', Georgia, serif;
  --font-ui: 'Inter', -apple-system, sans-serif;

  /* Type scale */
  --text-hero: 3.5rem;
  --text-h2: 2.25rem;
  --text-h3: 1.375rem;
  --text-body: 1rem;
  --text-small: 0.875rem;

  /* Spacing (8px base) */
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2rem;
  --space-6: 3rem;
  --space-8: 4rem;

  /* Radius — small and consistent, not oversized "SaaS card" rounding */
  --radius-sm: 4px;
  --radius-md: 8px;
}

body {
  background: var(--parchment);
  color: var(--charcoal);
  font-family: var(--font-ui);
  font-size: var(--text-body);
  line-height: 1.6;
}

h1, h2, h3, .display {
  font-family: var(--font-display);
  color: var(--ink-navy);
  line-height: 1.15;
}

.btn-primary {
  background: var(--ink-navy);
  color: var(--parchment);
  border: 1px solid var(--ink-navy);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.btn-primary:hover {
  background: var(--deep-indigo);
}

.badge-premium {
  background: var(--gold);
  color: var(--ink-navy);
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-sm);
}

.progress-bar-fill {
  background: var(--verdant);
}
```

Load the fonts via Google Fonts in your EJS layout `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## 5. Component Discipline (quick reference)

| Element | Rule |
|---|---|
| Buttons | One primary style (navy fill) per page. Gold is reserved for "premium/certificate" actions only, not every CTA. |
| Cards | Vary size/hierarchy by content importance — don't make every card identical. |
| Shadows | Use one subtle shadow value across the whole site, not per-component random shadows. |
| Icons | Pick one icon set (e.g., Lucide/Feather) and stick to it — mixing icon styles is a fast way to look unpolished. |
| Motion | One deliberate moment (e.g., progress ring filling on course completion) rather than fade-in animations on every scroll. |
