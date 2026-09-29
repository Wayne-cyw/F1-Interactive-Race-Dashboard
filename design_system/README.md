# APEX

Race intelligence for the pit wall. APEX is an unofficial, fan-built Formula 1 dashboard: live timing, tyre strategy and telemetry on one screen. This system covers its landing page, loading screen and the dashboard components that follow them. It is not affiliated with Formula 1 or any team, and it uses no team or series marks.

## Content fundamentals

Write like a race engineer talking to a driver: short, concrete, present tense. Say what the screen does, not how it is built.

- **Headlines** state one idea in two short beats, ending on a full stop: "Every lap. Read live." Never a question, never an exclamation mark.
- **Buttons** name the destination as a place: "Enter the pit wall". One primary action per screen, repeated down the page, never three competing ones.
- **Labels** are uppercase mono with wide tracking and a middle dot as separator: "01 · LIVE TIMING". Numbers in labels mark a real sequence only.
- **Status lines** describe what the system is doing in plain words: "Connecting to timing feed", "Syncing car telemetry", "Green flag".
- **Data** is never invented in marketing surfaces. Where a real figure is missing, use a marked placeholder such as `[YOUR TAGLINE OR YEAR]`.

## Visual foundations

**Ground.** Carbon black (`surface-000`) with panels one step lighter (`surface-100`) and inset wells another step (`surface-200`). Hairlines use `line` at 1px. A background grid of `line`-strength rules every `space-8` (80px) fades out with a radial or vertical mask.

**One bold thing.** Signal red (`brand`) is the only loud color and it appears as a fill: the primary button, live dots, the lap line, the leading bar. Red as text uses `brand-text`. A second hue, `data-b` blue, exists only to separate two data series. Never use red and blue as decorative pairs.

**Type.** Unbounded carries headlines and card titles in tight, heavy settings. Instrument Sans carries running text. JetBrains Mono carries every label, readout and legend, uppercase and tracked. Three families, three jobs, no overlap.

**Shape.** Cards use `radius-lg`, wells `radius-md`, buttons and tags `radius-pill`. Bars and stint segments use `radius-xs`. Racing references are geometric and small: a chevron mark, a checker band, diamond separators.

**Depth.** One shadow (`shadow-panel`) lifts the hero panel. Everything else is flat with a hairline. Hover lifts a card 8px and turns its border red.

**Motion.** See the Motion section. Motion carries meaning (live data, progress, sequence) and is limited to one orchestrated moment per screen plus ambient telemetry.

## Iconography

Icons are inline SVG, drawn on a 20 or 30px box with a 2.4 to 3.5px square-capped stroke. The mark is two nested chevrons, red over ink. Arrows are a horizontal shaft with a chevron head and nudge 6px right on hover. No emoji, no filled pictograms, no icon fonts.

## Usage rules

- Text on `surface-000`, `surface-100` and `surface-200` uses `ink` or `ink-muted`. Never place `brand` text on a surface; use `brand-text`.
- Anything sitting on a `brand` fill uses `on-brand`, never white.
- Two data series use `data-a` and `data-b` and differ in line position and legend, not only color.
- Tyre stints always use `compound-soft`, `compound-medium` and `compound-hard`, in that order in legends.
- Keep running text near 520px wide and never below 16px. Labels never go below 12px.
- Touch targets are at least 44px tall.
- Respect `prefers-reduced-motion`: stop looping animation and show the resting state.
