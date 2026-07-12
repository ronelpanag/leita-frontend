# Leita — Design Direction

**Direction name: “Waymark” — Nordic-functional with a trail motif.**

## Why this direction

_Leita_ is Old Norse for “to seek.” The product is a hiring pipeline: candidates
move through stages the way a hiker moves between waymarks on a marked trail.
That gives us a design language that is grounded in the product's own name and
mechanics — not a mood board bolted on afterwards.

Nordic-functional design (Schibsted, Bakken & Bæck, Norwegian public-sector
design) reads as **trustworthy and modern without being sterile-corporate**:
honest 1px edges instead of shadow stacks, generous whitespace, one warm accent
used sparingly, and typography doing most of the personality work.

**Anti-goals** (explicitly rejected): Inter + purple gradient SaaS; warm-cream
“editorial serif” template; near-black + acid-green; recruitment-platform
default blue (LinkedIn/Indeed territory).

## Palette

Cool paper neutrals, deep spruce green as the primary, cloudberry amber as the
single warm accent. Green = growth and stability without the corporate-blue
cliché; amber is reserved for “look here” moments (featured postings, warnings).

| Token      | Hex       | Role                                                         |
| ---------- | --------- | ------------------------------------------------------------ |
| Birch      | `#F6F7F5` | App background — cool, faintly green; deliberately not cream |
| Paper      | `#FFFFFF` | Card / surface background                                    |
| Ink        | `#1B2420` | Primary text — green-black, softer than pure black           |
| Ink muted  | `#5A6660` | Secondary text, captions                                     |
| Spruce     | `#1E5245` | Primary actions, links, focus rings (300–900 ramp)           |
| Cloudberry | `#E8930C` | Featured/promoted highlights, warnings (amber ramp)          |
| Fjord      | `#41698C` | Informational states, in-progress stage badges               |
| Rowan      | `#B3402A` | Errors, destructive actions                                  |

Border color is a visible `#DCE1DD` — edges are honest lines, not shadows.
Shadow exists at exactly one elevation (modal, toast); everything else sits
flat on the page.

## Typography

| Role               | Face                             | Why                                                                                                                                   |
| ------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Display / headings | **Schibsted Grotesk** (variable) | Open-source grotesque by Norwegian media group Schibsted — Nordic provenance matching the brand, characterful `a/g/t` without novelty |
| Body / UI          | **IBM Plex Sans**                | Engineered for interfaces, excellent legibility, warmer than Inter and not the default anyone reaches for                             |
| Data / numbers     | **IBM Plex Mono**                | Counts, dates, stage numbers set in mono read as precise and honest — the dashboard's “instrument panel” voice                        |

Scale: 1.2 ratio for UI density (dashboards must stay calm at high information
density), with a single display size (2.6rem) reserved for public-facing hero
moments. Headings: weight 600, tracking −0.01em, `text-wrap: balance`.
Numbers in tables always `tabular-nums`.

All fonts are self-hosted via Fontsource npm packages — no runtime CDN calls.

## Signature element: the waymark trail

One motif, used systematically and nowhere else:

- **Stage badges** carry a small leading waymark tick (▸-shaped), making any
  pipeline stage instantly recognizable across the app.
- **Spinner** is a rotating dashed ring — a compass seeking north.
- **Empty states** use a dotted-trail illustration: the path is there, nothing
  is on it yet — an invitation to act, not an apology.

Everything around the signature stays quiet: no gradients, no decorative
illustration, no rounded-blob shapes.

## Shape & depth

- Radius: `6px` controls, `10px` cards — soft enough to be friendly, tight
  enough to feel precise.
- Depth: 1px borders everywhere; one shadow level (`overlay`) for modal/toast.

## Motion philosophy

Motion means _arrival along the trail_: elements enter with a 4px rise + fade,
200ms, `cubic-bezier(0.2, 0, 0, 1)`. Micro-feedback (hover, press) is 120ms.
Overlays are 320ms. Nothing loops except the spinner. `prefers-reduced-motion`
disables all transform/opacity transitions globally — this is wired into the
base stylesheet, not left to individual components.

## Voice

Active voice, sentence case, specific verbs (“Publish job”, not “Submit”).
Errors say what happened and what to do next. Empty states invite the next
action. Numbers are numerals (“8 applications”). Loading copy ends with “…”.
