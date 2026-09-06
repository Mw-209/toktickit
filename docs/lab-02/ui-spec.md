# Zen Green Theme UI Specification

**Project:** TokTickIT — Requester Ticketing MVP (Lab 2)  
**Standard:** Zen Green Design Language & Responsive Framework  

---

## 1. Color Tokens & Visual System

| Token Name | Hex Value | Intended Usage | Contrast Ratio vs White |
|---|---|---|---|
| `--color-primary-green` | `#006B3C` | Global App Header background, primary call-to-action buttons, high-emphasis icons | > 4.5:1 (AAA) |
| `--color-secondary-green` | `#0B7A46` | Active navigation tabs, focus rings, interactive links, hover states | > 4.5:1 (AA) |
| `--color-pale-green` | `#EAF6EF` | Selected card highlights, success callout banners, subtle container shading | Background tone |
| `--color-bg-page` | `#F5F7F6` | Default viewport background for entire application | Near-white quiet tone |
| `--color-surface` | `#FFFFFF` | Card backgrounds, modals, dropdown menus, table bodies | Neutral surface |
| `--color-surface-border` | `#E2E8F0` | Subtle hairline borders on cards, table rows, and dividers | Non-distracting boundary |
| `--color-text-main` | `#1A202C` | Primary heading and body text (dark charcoal-green, avoiding pure black) | High readability |
| `--color-text-muted` | `#4A5568` | Subtitles, helper text, table header labels, timestamps | Subtle distinction |
| `--color-field-editable-bg`| `#FFFFFF` | Form input backgrounds | Standard input surface |
| `--color-field-border` | `#CBD5E1` | Default neutral border for inputs and selects | Clean boundary |
| `--color-field-readonly-bg`| `#EAF1ED` | Soft gray-green shading for read-only / system-generated fields | Clearly non-editable |
| `--color-error` | `#B91C1C` | Field error messages, invalid input borders, alert banners | High alert visibility |
| `--color-error-bg` | `#FEF2F2` | Background tint for error callouts | Gentle error wash |
| `--color-warning` | `#D97706` | Medium priority / cautionary badge and amber callouts | Distinct accent |
| `--color-success` | `#047857` | Green confirmation alerts, success badges, check icons | Positive status |

---

## 2. Typography & Spacing Scale

* **Font Family:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
* **Hierarchy:**
  * **H1 (Page Title):** 28px (1.75rem), weight 700, line-height 1.2
  * **H2 (Card Title / Section):** 20px (1.25rem), weight 600, line-height 1.3
  * **H3 (Sub-header / Table Header):** 16px (1.0rem), weight 600, line-height 1.4
  * **Body Regular:** 14px (0.875rem), weight 400, line-height 1.5
  * **Body Small / Captions:** 12px (0.75rem), weight 400, line-height 1.4
* **8-Point Spacing Grid:**
  * `space-xs`: 4px (tight inline gaps, badge padding)
  * `space-sm`: 8px (icon-to-text spacing, input vertical padding)
  * `space-md`: 16px (form field gaps, card padding on mobile)
  * `space-lg`: 24px (card padding on desktop, section dividers)
  * `space-xl`: 32px (container vertical margin)

---

## 3. Form Controls, States & Validation

* **Input Standard Height:** `40px` (38px input + 2px border) for text inputs, selects, and buttons.
* **Multiline Description:** Minimum height `120px`, constrained with `resize: vertical` to prevent horizontal layout disruption.
* **Control States:**
  * **Default:** `#CBD5E1` border, `#FFFFFF` background.
  * **Focus:** `#0B7A46` border with `0 0 0 3px rgba(11, 122, 70, 0.2)` glow.
  * **Read-only / Disabled:** `#EAF1ED` background, `#D1DCD6` border, `#2D3748` text, `cursor: not-allowed` or `read-only`.
  * **Invalid:** `#B91C1C` border with `0 0 0 3px rgba(185, 28, 28, 0.2)` glow.
* **Required Indicator:** Red asterisk (`*` in `#B91C1C`) placed immediately next to the label.
* **Validation Placement:** Error message text renders in `#B91C1C` directly underneath the corresponding form control, never aggregated solely at page top.

---

## 4. Button Hierarchy & Interactive States

1. **Primary Button:**
   * Background `#006B3C`, text white, font-weight 600.
   * Hover: `#0B7A46`.
   * Focus: `#0B7A46` ring with 3px offset.
   * Busy / Loading: Disabled, cursor `wait`, displays inline animated SVG spinner with "Processing…".
2. **Secondary Button:**
   * Background white, border `1px solid #CBD5E1`, text `#1A202C`.
   * Hover: `#F1F5F9`, border `#94A3B8`.
3. **Destructive / Soft-Remove Button:**
   * Text only or subtle icon in `#DC2626`, hover background `#FEE2E2`.
4. **Disabled State:**
   * Background `#E2E8F0`, text `#94A3B8`, border `#CBD5E1`, `cursor: not-allowed`.

---

## 5. Status & Priority Badges

* **Current Status Badges:**
  * `NEW`: Pale green background (`#EAF6EF`), dark green text (`#006B3C`), green border.
  * `IN_PROGRESS`: Soft blue background (`#EFF6FF`), dark blue text (`#1D4ED8`).
  * `RESOLVED`: Soft teal background (`#F0FDFA`), dark teal text (`#0F766E`).
  * `CLOSED`: Light neutral background (`#F1F5F9`), slate text (`#475569`).
* **Priority Badges:**
  * `LOW`: Slate (`#F1F5F9` / `#475569`).
  * `MEDIUM`: Amber (`#FEF3C7` / `#B45309`).
  * `HIGH`: Orange (`#FFEDD5` / `#C2410C`).
  * `URGENT`: Red (`#FEE2E2` / `#B91C1C`).

---

## 6. Responsive Viewport Rules

| Viewport | Breakpoint | Structural Behavior |
|---|---|---|
| **Desktop** | `≥ 992px` | Multi-column grid; centered container (`max-width: 1200px`); My Tickets renders tabular data; Create Ticket presents system fields side-by-side. |
| **Tablet** | `768px – 991px` | Two-column grid where applicable; summary and description receive full horizontal span; table remains scrollable with sticky headers. |
| **Mobile** | `< 768px` | Single-column vertical stack; all form buttons expand to 100% width with min-height 44px for touch targets; My Tickets switches to card-based list. Zero horizontal scrolling. |

---

## 7. Screen Specifications

### 7.1 Development Requester Selection Screen
* Centered card container (max-width 560px).
* Prominent header with avatar/user icon.
* Cautionary callout banner: "Development Testing Mechanism — not a login screen. Real authentication is introduced in Lab 3."
* Dropdown listing all active Requesters populated from PostgreSQL.
* "Continue" primary button.
* Accessible empty and API-error states.

### 7.2 Create Ticket Screen
* **Header Bar:** Breadcrumbs (`My Tickets > Create Ticket`) and page title.
* **Read-only Meta Strip:** Ticket Number preview (`Assigned automatically on save`), Ticket Date (`Current timestamp`), Requester Name (`Current context`).
* **Classification Section:** Category dropdown, Related System dropdown, Requested Priority selector.
* **Problem Detail Section:** Summary input (with character counter 5–100), Description textarea (with character counter 10–2000).
* **Attachment Section:** Drag-and-drop zone with clear guidelines: "Allowed: JPG, PNG, WEBP, PDF (Max 5MB each, up to 5 files)". Dynamic file list with remove-before-upload button.
* **Footer Actions:** Secondary "Cancel" button, Primary "Submit Ticket" button with busy state indicator.

### 7.3 My Tickets Screen
* **Top Ribbon:** Search input (with search icon and clear button), Category filter, Priority filter, Status filter, "Clear Filters" button, and "+ Create Ticket" primary button.
* **Desktop View:** Data table with sortable columns (`Ticket No.`, `Created Date`, `Summary`, `Category`, `Requested Priority`, `Current Status`, `Last Updated`). Clicking a row opens Ticket Detail.
* **Mobile View:** Vertical card stack displaying Ticket No, badges for Status and Priority, Summary snippet, and date.
* **Pagination Controls:** Showing record ranges (`Showing 1 to 10 of 42 tickets`), page numbers, and "Previous" / "Next" buttons.
* **Empty States:**
  * *No tickets submitted yet:* Friendly empty illustration with "Create your first ticket" call-to-action button.
  * *No search results:* "No tickets match your filter criteria" with "Reset Filters" button.

### 7.4 Requester Ticket Detail Screen
* **Action Bar:** "Back to My Tickets" secondary link.
* **Ticket Overview Card:** Read-only badges for Ticket Number, Status, Category, Related System, and Priority.
* **Problem Description Card:** Summary and full Description formatted cleanly.
* **Attachments Card:**
  * List of attached files with icons (image vs PDF), filename, size in KB/MB, and upload date.
  * Active files include "Download" button.
  * Active files include "Remove" button which triggers the Soft-removal Modal.
  * Soft-removed files appear in muted gray tone with a badge: `Removed on [Date] — Reason: "[Reason]"`. Download link is disabled.
  * "Add Attachment" button (disabled if 5 active attachments reached).
* **Soft-removal Confirmation Modal:**
  * Displays filename being removed.
  * Mandatory textarea for removal reason (minimum 3 characters).
  * "Cancel" and "Confirm Removal" buttons.

---

## 8. Visual Inspection Checklist & Screenshot Artifacts

Before declaring DoD complete, screenshots must be captured under `artifacts/lab-02/screenshots/`:
1. `create-ticket/`: Desktop initial, validation errors, file attached, busy/submitting state, success confirmation.
2. `my-tickets/`: Desktop full table, filtered results, empty state, mobile card view.
3. `ticket-detail/`: Desktop view with active attachment, soft-removal modal, and post-removal metadata view.
