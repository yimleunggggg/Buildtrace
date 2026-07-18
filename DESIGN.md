# BuildTrace Design System

## Product posture

BuildTrace is a read-only project memory surface, not an analytics dashboard. Its job is to help a person or a new Agent answer four questions quickly:

1. Why did we make this decision?
2. What actually changed?
3. What evidence supports the record?
4. Did the result work?

The interface should feel like an editorial field notebook paired with a calm command desk: serious enough to trust, light enough to scan every day.

## Information architecture

- **Tutorial / 教程** explains the workflow in four short steps and never blocks access to the data.
- **Board / 看板** opens on the strongest current signals: total records, pending reviews, effective decisions, and the next review date.
- The desktop workspace uses a record index beside one focused detail pane.
- Mobile uses a two-level flow: record list first, then a full-screen detail view with a clear back action.
- Search and filters change the visible index only. They never mutate `BUILDTRACE.md`.

## Voice and bilingual rules

- Product chrome is available in Simplified Chinese and English.
- Recorded project content remains in its source language. Never machine-translate evidence or user quotes silently.
- Chinese is the default because the current project record is written in Chinese.
- Labels are short nouns or verb phrases. Avoid welcome copy, slogans, and explanatory paragraphs in the working view.
- Date, status, source trust, and evidence are always visible before the longer narrative.

## Visual language

- **Canvas:** warm paper `#F3F0E8`
- **Primary ink:** `#19211D`
- **Muted ink:** `#667068`
- **Rule:** `#D6D2C7`
- **Signal red:** `#E34B32` for pending or attention
- **Action blue:** `#1D5FD1` for links and selected controls
- **Confirmed green:** `#2C7658`
- **Display type:** Iowan Old Style / Songti SC
- **Interface type:** Avenir Next / Noto Sans SC / PingFang SC
- **Metadata type:** SFMono-Regular / Menlo / monospace

Borders and rules organize the app. Shadows are reserved for the mobile detail sheet and keyboard focus. Cards are used only when the whole surface is interactive.

## Spacing and density

- Base unit: `4px`
- Working rhythm: `8, 12, 16, 24, 32, 48`
- Comfortable row: `88px` minimum
- Compact row: `68px` minimum
- Desktop content max width: `1600px`
- Touch targets: `44px` minimum

## Motion

- Press feedback: `transform: scale(0.97)` for `120ms`
- View entry: opacity + `translateY(6px)` for `220ms` with `cubic-bezier(0.23, 1, 0.32, 1)`
- Mobile detail: `translateX(100%)` to `0` for `240ms`
- No animation on search, keyboard navigation, or repeated filter changes.
- `prefers-reduced-motion` removes spatial motion while retaining short opacity changes.

## Accessibility and responsive behavior

- Visible focus rings use the action blue and never depend on browser defaults alone.
- Body copy is at least `16px` on mobile.
- Status never relies on color alone; every status includes text.
- At `900px`, the two-pane workspace becomes a single list with an overlay detail view.
- At `640px`, primary navigation becomes a fixed bottom bar and the four signals become one compact row so records remain visible in the first screen.
- No horizontal page scrolling at any supported viewport.
