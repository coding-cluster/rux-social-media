# DESIGN.md — Rux, "Hang"

## Tokens (as implemented, `src/styles/main.css`)

```css
@theme {
  --font-sans: 'Archivo', sans-serif;
  --font-expanded: 'Archivo Expanded', sans-serif;

  --color-wall: #d9d9cf;
  --color-wall-deep: #c6c6ba;
  --color-mount: #f2f1ec;
  --color-graphite: #22231f;
  --color-ultramarine: #2e3fd0;
  --color-oak: #b39a76;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-md: 1.125rem;
  --text-lg: 1.5rem;
  --text-xl: 2.25rem;
  --text-2xl: 3.75rem;

  --datum: 50%;
}
```

`--datum` is a real custom property, read by the post layout to vertically
center every image on the same sightline regardless of aspect ratio.

## Type scale

| Step | rem | Use |
|---|---|---|
| xs | 0.75 | metadata (dates, counts) — 400, +0.05em tracking |
| sm | 0.875 | UI, handles — 500 |
| base | 1 | body |
| md | 1.125 | captions — italic 400, 1.55 line-height, ~62ch max |
| lg | 1.5 | section headings |
| xl | 2.25 | empty-state headlines — Expanded 600, -0.02em tracking |
| 2xl | 3.75 | wordmark, hero moments |

No sizes exist between these steps. A component that "almost fits" changes
step, it doesn't invent a value.

## Wireframes

### Feed — desktop (1440px)

```
┌──────────────────────────────────────────────────────────┐
│ rux                                        you   compose │
├──────────────────────────────────────────────────────────┤
│   maya cortés          ┌────────────────────────────┐    │
│   3 days ago           │        mount                │   │
│                        │   ┌────────────────────┐    │   │
│                        │   │      image         │←datum  │
│                        │   └────────────────────┘    │   │
│   the last of the      │                              │  │
│   afternoon light      └────────────────────────────┘    │
│   41 likes                                               │
├──────────────────────────────────────────────────────────┤
│   (next post, same datum)                                │
└──────────────────────────────────────────────────────────┘
```

### Feed — 390px

```
┌───────────────────────┐
│ rux         you compose│
├───────────────────────┤
│ maya cortés · 3d ago  │
│ ┌───────────────────┐ │
│ │      mount        │ │
│ │  ┌─────────────┐  │ │
│ │  │   image     │←datum
│ │  └─────────────┘  │ │
│ └───────────────────┘ │
│ the last of the       │
│ afternoon light       │
│ 41 likes              │
└───────────────────────┘
```

### Post `/p/:id` — desktop

```
┌──────────────────────────────────────────────────────────┐
│ rux                                        you   compose │
├──────────────────────────────────────────────────────────┤
│   maya cortés          ┌────────────────────────────┐    │
│   3 days ago           │          mount              │   │
│                        │   ┌────────────────────┐    │   │
│                        │   │   image, larger    │←datum  │
│                        │   └────────────────────┘    │   │
│   the last of the      └────────────────────────────┘    │
│   afternoon light                                        │
│   41 likes                                                │
│   ────────────────────────────                           │
│   comments (roman, stacked)                               │
│   [ write a comment            ] [post]                   │
└──────────────────────────────────────────────────────────┘
```

Mobile: label row collapses above the mount, same as feed; comments stack
full-width below.

### Profile `/u/:handle` — desktop

```
┌──────────────────────────────────────────────────────────┐
│ rux                                        you   compose │
├──────────────────────────────────────────────────────────┤
│   maya cortés                                             │
│   bio line, roman                                          │
│   30 posts                                                 │
│                                                            │
│   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                 │
│   │ post  │ │ post  │ │ post  │ │ post  │  dense grid     │
│   └───────┘ └───────┘ └───────┘ └───────┘                 │
└──────────────────────────────────────────────────────────┘
```

Mobile: 2-column grid, same tiles.

### Compose `/compose` — desktop & mobile (single column both)

```
┌───────────────────────┐
│ rux                    │
├───────────────────────┤
│ [ choose a file ]      │
│ ┌───────────────────┐ │
│ │  preview on mount  │ │
│ └───────────────────┘ │
│ [ caption, italic ]    │
│ [ Hang it ]            │
└───────────────────────┘
```

### Auth `/auth` — desktop & mobile (single column both)

```
┌───────────────────────┐
│         rux            │
│ [ email    ]           │
│ [ password ]           │
│ [ Sign in ]             │
│ New here? Sign up       │
└───────────────────────┘
```

## What makes Rux not look like anything else

Every other feed app centers content in a card and lets each card be a
different height, so nothing on screen lines up. Rux fixes one sightline —
the datum — and forces every image, whatever its shape, to meet it inside a
paper mount instead of a rounded card. The eye tracks a straight line down
the page the way it would down a real gallery wall, and that line is the
thing a screenshot actually captures, not the individual posts.

## Self-critique (second pass against the brief)

Re-reading the brief cold, the risk was defaulting to a card-based Instagram
clone with the tokens re-skinned on top — technically compliant, visually
generic. Two things were revised before build:

1. Almost gave post metadata its own card/background (`bg-mount` box around
   the label column). Cut it — the brief is explicit that labels sit beside
   the mount on plaster, not in their own container. A label with a
   background is a card wearing a costume.
2. Was going to default to centering the compose preview and auth form on
   the page horizontally *and* vertically. Kept vertical centering (there's
   no wall to anchor to on those two utility screens) but left-aligned all
   text within them, per "never centre body text."

No other deviation from the brief's layout or token spec.
