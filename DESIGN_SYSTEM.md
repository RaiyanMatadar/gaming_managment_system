# CyberArena Design System

This design system centralizes UI tokens, colors, elevation, and component primitives across the CyberArena Gaming Management System. It is generated from the Material Theme Builder export at `src/frontend/styles/material.json`.

---

## 1. Architecture & File Structure

```
src/frontend/
├── styles/
│   ├── material.json       # Master token definition (Material Theme Builder export)
│   └── tokens.css          # CSS variables for :root (light) and .dark (dark mode)
├── components/
│   └── ui/                 # Centralized UI primitive layer
│       ├── Button.jsx      # Button component with semantic variants
│       ├── Card.jsx        # Surface container card component
│       ├── Input.jsx       # Form input primitive
│       ├── Select.jsx      # Form select primitive
│       ├── Badge.jsx       # Status / category badge primitive
│       ├── Modal.jsx       # Dialog overlay & modal primitive
│       └── index.js        # Barrel export
├── index.css               # Imports tokens.css & defines design system utility layers
└── App.jsx                 # Main application workspace
```

---

## 2. Token Definitions & Mapping

All semantic tokens are exported from `material.json` into CSS custom properties in `src/frontend/styles/tokens.css` and mapped to Tailwind utilities in `tailwind.config.js`.

### Color Roles

| Token Utility | CSS Variable | Semantic Usage |
|---|---|---|
| `bg-primary`, `text-primary` | `--md-primary` | Primary brand accent and key call-to-actions |
| `text-on-primary` | `--md-on-primary` | Text/icons placed on top of `primary` |
| `bg-primary-container` | `--md-primary-container` | Filled container/active pill backgrounds |
| `text-on-primary-container` | `--md-on-primary-container` | Text/icons placed on top of `primary-container` |
| `bg-secondary` | `--md-secondary` | Secondary supporting accents |
| `bg-tertiary` | `--md-tertiary` | Highlight accents (e.g., PS5, timer paused) |
| `bg-surface` | `--md-surface` | Main backdrop and foundational surfaces |
| `text-on-surface` | `--md-on-surface` | Main high-contrast headings and body text |
| `text-on-surface-variant` | `--md-on-surface-variant` | Muted descriptions, secondary labels, metadata |
| `bg-surface-container-lowest` | `--md-surface-container-lowest` | Darkest inset panels (e.g., timers, data tables) |
| `bg-surface-container-low` | `--md-surface-container-low` | Sidebar and header navigation shells |
| `bg-surface-container` | `--md-surface-container` | Default card containers, station cards, stat blocks |
| `bg-surface-container-high` | `--md-surface-container-high` | Hover states, active cards, elevated containers |
| `border-outline` | `--md-outline` | Standard structural borders |
| `border-outline-variant` | `--md-outline-variant` | Subtle dividers, subtle card borders |
| `text-error`, `bg-error` | `--md-error` | Critical alerts, session overtime, destructive actions |
| `bg-error-container` | `--md-error-container` | Error banner backgrounds, overtime warning cards |

### Shape Tokens

- `rounded-xs`: 4px (`--md-shape-xs`)
- `rounded-sm`: 8px (`--md-shape-sm`)
- `rounded-md`: 12px (`--md-shape-md`)
- `rounded-lg`: 16px (`--md-shape-lg`)
- `rounded-xl`: 24px (`--md-shape-xl`)
- `rounded-full`: 9999px (`--md-shape-full`)

---

## 3. UI Primitives (`src/frontend/components/ui/`)

Import primitives directly from `./ui`:
```jsx
import { Button, Card, Input, Select, Badge, Modal } from './ui';
```

### `<Button />`
- **Variants**:
  - `filled` (default): Primary brand filled button (`bg-primary text-on-primary`)
  - `tonal`: Secondary container button (`bg-secondary-container text-on-secondary-container`)
  - `outlined`: Subdued border button (`border border-outline-variant text-on-surface`)
  - `text`: Low-emphasis text-only button (`text-primary`)
  - `error`: Destructive action button (`bg-error-container text-on-error-container border border-error/30`)
  - `success`: Positive confirmation button (`bg-emerald-950/60 text-emerald-300 border border-emerald-500/40`)
- **Sizes**: `sm`, `md` (default), `lg`, `icon`, `icon-md`
- **Props**: `fullWidth` (boolean), `disabled` (boolean), `className` (string)

### `<Card />`
- **Variants**:
  - `container` (default): Standard surface card (`bg-surface-container border border-outline-variant/60`)
  - `low`: Low surface container (`bg-surface-container-low border border-outline-variant/40`)
  - `lowest`: Dark inset container (`bg-surface-container-lowest border border-outline-variant/50`)
  - `high`: Elevated surface (`bg-surface-container-high border border-outline-variant`)
  - `outlined`: Transparent with border (`bg-transparent border border-outline-variant`)
- **Props**: `rounded` (default `'rounded-xl'`), `className` (string)

### `<Badge />`
- **Variants**: `primary`, `secondary`, `tertiary`, `success`, `warning`, `error`, `neutral`
- **Sizes**: `xs`, `sm` (default), `md`, `pill`

### `<Input />` & `<Select />`
- Standardized inputs styled with `bg-surface-container-lowest border border-outline-variant focus:border-primary text-on-surface`.
- Supports `size="sm" | "md"` and `fullWidth`.

### `<Modal />`
- Complete modal wrapper featuring backdrop blur, header with customizable icon, title, subtitle, close button, and action footer slots.

---

## 4. Mandatory Rules for Engineers and Agents

1. **NEVER use arbitrary hex / RGB colors**:
   - ❌ Bad: `bg-[#0e1219]`, `text-[#38bdf8]`, `border-[#1e2638]`
   - ✅ Good: `bg-surface-container`, `text-primary`, `border-outline-variant/60`

2. **NEVER use hardcoded non-semantic Tailwind palettes**:
   - ❌ Bad: `bg-blue-600 text-white`, `text-slate-400`, `bg-cyan-500`
   - ✅ Good: `bg-primary text-on-primary`, `text-on-surface-variant`, `bg-primary-container`

3. **ALWAYS use UI Primitives for interactive elements**:
   - ❌ Bad: `<button className="px-3 py-1.5 rounded-lg bg-blue-600 ...">`
   - ✅ Good: `<Button variant="filled" size="sm">`

4. **Never modify `material.json` directly**:
   - If color palettes need to change, re-export from Material Theme Builder.
