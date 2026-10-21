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
| `bg-success`, `text-success` | `--md-success` | Positive confirmations, paid sessions, available hardware |
| `bg-success-container` | `--md-success-container` | Success badges, on-time indicators |
| `bg-warning`, `text-warning` | `--md-warning` | Expiry warnings, attention notices |
| `bg-warning-container` | `--md-warning-container` | Warning banners, 5-minute alert chips |

### Shape Tokens (Material Design 3)

- `rounded-xs`: 4px (`--md-shape-xs`) — Inputs, select fields
- `rounded-sm`: 8px (`--md-shape-sm`) — Filter chips, compact tags
- `rounded-md`: 12px (`--md-shape-md`) — Small containers, nested cards
- `rounded-lg`: 16px (`--md-shape-lg`) — Standard cards, station cards, FABs
- `rounded-xl`: 28px (`--md-shape-xl`) — Dialogs, modal sheets, full popups
- `rounded-full`: 9999px (`--md-shape-full`) — Pill buttons, badges, round avatars

### Soft Elevation Scale

- `shadow-m3-1`: Level 1 soft tonal shadow (cards on hover, active buttons)
- `shadow-m3-2`: Level 2 soft shadow (menus, bottom bars)
- `shadow-m3-3`: Level 3 soft shadow (dialogs, FABs, navigation drawers)
- `shadow-m3-4`: Level 4 soft shadow
- `shadow-m3-5`: Level 5 soft shadow

---

## 3. UI Primitives (`src/frontend/components/ui/`)

Import primitives directly from `./ui`:
```jsx
import {
  Button,
  FAB,
  Chip,
  Card,
  Input,
  Select,
  TextField,
  Badge,
  Modal,
  Snackbar,
  TopAppBar,
  Tabs,
  Switch,
  Checkbox,
  Icon
} from './ui';
```

### `<Button />`
- **Variants**:
  - `filled` (default): Primary brand filled button (`bg-primary text-on-primary rounded-full`)
  - `tonal`: Secondary container button (`bg-secondary-container text-on-secondary-container rounded-full`)
  - `outlined`: Subdued border button (`border border-outline text-primary rounded-full`)
  - `text`: Low-emphasis text-only button (`text-primary rounded-full`)
  - `error`: Destructive action button (`bg-error text-on-error rounded-full`)
  - `success`: Positive confirmation button (`bg-success text-on-success rounded-full`)
- **Sizes**: `sm` (32px), `md` (40px default), `lg` (48px touch target), `icon`, `icon-md`

### `<Card />`
- **Variants**:
  - `container` (default): Standard surface card (`bg-surface-container rounded-[16px]`)
  - `low`: Low surface container (`bg-surface-container-low rounded-[16px]`)
  - `lowest`: Inset container (`bg-surface-container-lowest rounded-[16px]`)
  - `high`: Elevated surface (`bg-surface-container-high rounded-[16px]`)
  - `outlined`: Outlined surface (`bg-surface border border-outline-variant/50 rounded-[16px]`)

### `<Chip />`
- Material Design 3 filter/action chip with rounded-8px or pill shape, optional leading icon/avatar, label, and trailing count badge.

### `<FAB />`
- Floating Action Button with soft elevation (`shadow-m3-3`), available in small, regular, and extended modes.

### `<Badge />`
- **Variants**: `primary`, `secondary`, `tertiary`, `success`, `warning`, `error`, `neutral`
- **Sizes**: `xs`, `sm` (default), `md`, `pill` (all fully rounded)

### `<Input />`, `<Select />` & `<TextField />`
- Outlined and filled input primitives with 4px border radius (`rounded-[4px]`), 48px touch targets, and accessible focus rings.

### `<Modal />`
- Material 3 dialog with 28px border radius (`rounded-[28px]`), `bg-surface-container-high`, soft `shadow-m3-3`, title, subtitle, customizable icon, and action footer.

### `<Snackbar />`
- Material 3 toast banner with `bg-inverse-surface text-inverse-on-surface`.

---

## 4. Mandatory Rules for Engineers and Agents

1. **NEVER use arbitrary hex / RGB colors**:
   - ❌ Bad: `bg-[#0e1219]`, `text-[#38bdf8]`, `border-[#1e2638]`
   - ✅ Good: `bg-surface-container`, `text-primary`, `border-outline-variant/60`

2. **NEVER use hardcoded non-semantic Tailwind palettes**:
   - ❌ Bad: `bg-blue-600 text-white`, `text-slate-400`, `bg-cyan-500`, `text-amber-300`, `bg-emerald-500`
   - ✅ Good: `bg-primary text-on-primary`, `text-on-surface-variant`, `bg-success`, `text-warning`

3. **ALWAYS use UI Primitives for interactive elements**:
   - ❌ Bad: `<button className="px-3 py-1.5 rounded-lg bg-blue-600 ...">`
   - ✅ Good: `<Button variant="filled" size="sm">`

4. **Never modify `material.json` directly**:
   - If color palettes need to change, re-export from Material Theme Builder.
