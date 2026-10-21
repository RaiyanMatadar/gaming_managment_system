# AI Agent Guidelines for CyberArena Frontend

When editing, modifying, or creating UI components in this codebase:

## 1. Zero Custom / Hardcoded Colors
- **DO NOT** use arbitrary hex, rgb, or hsl values (e.g., `bg-[#...]`, `text-[#...]`, `border-[#...]`).
- **DO NOT** use default Tailwind color palette utilities (e.g., `bg-blue-600`, `text-slate-400`, `bg-cyan-500`, `text-amber-300`).
- **ALWAYS** use the semantic design tokens defined in `src/frontend/styles/tokens.css` and `tailwind.config.js`.

### Token Quick Reference
- Backdrops & Surfaces: `bg-background`, `bg-surface`, `bg-surface-container`, `bg-surface-container-low`, `bg-surface-container-high`, `bg-surface-container-lowest`
- Typography & Icons: `text-on-surface`, `text-on-surface-variant`, `text-primary`, `text-on-primary`, `text-outline`
- Brand & Key Actions: `bg-primary`, `text-on-primary`, `bg-primary-container`, `text-on-primary-container`
- Alerts & Destructive: `bg-error`, `text-error`, `bg-error-container`, `text-on-error-container`
- Borders & Dividers: `border-outline`, `border-outline-variant`, `border-outline-variant/40`, `border-outline-variant/60`

## 2. Mandatory Use of UI Primitives
Always import and use the primitives in `src/frontend/components/ui`:
- Buttons: `<Button variant="filled | tonal | outlined | text | error | success" size="sm | md | lg">`
- Containers & Cards: `<Card variant="container | low | lowest | high | outlined">`
- Inputs & Selects: `<Input />`, `<Select />`
- Badges & Status Chips: `<Badge variant="primary | secondary | tertiary | success | warning | error | neutral">`
- Modals & Overlays: `<Modal isOpen onClose title icon subtitle footer>`

## 3. Preservation of Logic & Contracts
- Never edit `src/frontend/styles/material.json` directly.
- Preserve all existing props contracts, API routes, timers, SSE real-time streaming handlers, and test logic.
- Before completing tasks, always verify that `npm run build` and `npm test` pass.
