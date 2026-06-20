# TeaMind Design System

## 1. Atmosphere & Identity

TeaMind is a quiet internal command center for store knowledge, training, and bilingual operations. The signature is restrained utility: dense information, clear controls, and low-contrast surfaces that stay readable during repeated daily use.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/primary | --surface-primary | #FFFFFF | #101010 | Main app background |
| Surface/secondary | --surface-secondary | #F7F7F7 | #171717 | Sidebar and panels |
| Surface/elevated | --surface-elevated | #FFFFFF | #202020 | Drawers and forms |
| Text/primary | --text-primary | #1A1A1A | #F5F5F5 | Body and headings |
| Text/secondary | --text-secondary | #666666 | #B5B5B5 | Help text |
| Text/tertiary | --text-tertiary | #999999 | #7A7A7A | Captions and disabled |
| Border/default | --border-default | #E5E5E5 | #333333 | Dividers and inputs |
| Border/subtle | --border-subtle | #F0F0F0 | #262626 | Soft separators |
| Surface/active | --surface-active | #E8E8E8 | #2A2A2A | Selected rows and neutral avatars |
| Surface/muted | --surface-muted | #F0F0F0 | #262626 | User message bubbles |
| Accent/primary | --accent-primary | #1A1A1A | #F5F5F5 | Primary buttons |
| Accent/hover | --accent-hover | #333333 | #FFFFFF | Hover state |
| Accent/warm | --accent-warm | #D4A574 | #D4A574 | Current user avatar |
| Status/success | --status-success | #16803A | #43C46B | Saved state |
| Status/warning | --status-warning | #B7791F | #E6A23C | Caution |
| Status/error | --status-error | #C24141 | #F87171 | Errors and destructive |
| Status/info | --status-info | #2563EB | #60A5FA | Informational |

### Rules
- Use neutral surfaces first; status colors only communicate state.
- Accent is reserved for primary commands and active selections.
- Do not add decorative gradients.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| H1 | 22px | 500 | 1.35 | 0 | Empty-state prompt |
| H2 | 18px | 600 | 1.35 | 0 | Panel titles |
| H3 | 15px | 600 | 1.4 | 0 | Section titles |
| Body | 14px | 400 | 1.65 | 0 | Chat and forms |
| Body/sm | 13px | 400 | 1.5 | 0 | Sidebar and controls |
| Caption | 12px | 500 | 1.4 | 0 | Metadata |
| Overline | 11px | 600 | 1.3 | 0.04em | Section labels |

### Font Stack
- Primary: system UI, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Mono: ui-monospace, SFMono-Regular, Menlo, monospace

### Rules
- Body text never below 12px in controls and never below 14px in reading areas.
- Letter spacing stays at zero except compact overline labels.

## 4. Spacing & Layout

### Base Unit
All spacing derives from 4px.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Tight inline spacing |
| --space-2 | 8px | Compact controls |
| --space-3 | 12px | Form field padding |
| --space-4 | 16px | Panel padding |
| --space-5 | 20px | Drawer padding |
| --space-6 | 24px | Chat area padding |
| --space-8 | 32px | Section separation |
| --space-10 | 40px | Empty state vertical rhythm |

### Grid
- Sidebar width: 260px.
- Chat max width: 720px.
- Knowledge drawer width: 420px desktop, full width on mobile.

### Rules
- Keep operational UI compact and scannable.
- Controls must not resize when labels change language.

## 5. Components

### Sidebar
- Structure: search, conversation list, settings footer.
- States: active row, hover actions, disabled loading.
- Accessibility: icon-only controls include visible text or title.

### Drawer
- Structure: fixed right panel with header, form, list, and status message.
- States: loading, empty, error, editing.
- Accessibility: close button has text label.

### Chat Composer
- Structure: single-line input with stable send button.
- States: disabled, loading, focused.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 120ms | ease-out | Button hover |
| Standard | 200ms | ease-in-out | Sidebar and drawer |

### Rules
- Animate opacity and transform only when practical.
- Every button has hover, focus, active, and disabled states.
- Reduced motion should still leave all content visible.

## 7. Depth & Surface

### Strategy
Borders-only.

| Type | Value | Usage |
|------|-------|-------|
| Default | 1px solid var(--border-default) | Panels, inputs |
| Subtle | 1px solid var(--border-subtle) | Row separators |
