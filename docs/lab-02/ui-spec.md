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

---

## 9. Accessibility Labels & ARIA Attributes

### 9.1 Global Application Shell
* **App Header `<header>`:** `role="banner"`, contains the application name and the Requester switcher dropdown.
* **Main Navigation `<nav>`:** `aria-label="Primary navigation"` to distinguish from any secondary nav regions.
* **Main Content `<main>`:** `role="main"` to mark the primary content area for screen readers.
* **Skip Link:** `<a href="#main-content" class="sr-only">Skip to main content</a>` placed as the first focusable element for keyboard-only users.

### 9.2 Requester Selection Screen
* **Dropdown `<select>`:** `id="requester-select"`, `aria-label="Select Development Requester"`, `aria-required="true"`.
* **Warning Banner:** `role="alert"` on the cautionary callout to surface development context notice to assistive technologies.
* **Continue Button:** `aria-disabled="true"` when no Requester is selected; removed once a valid selection is made.

### 9.3 Create Ticket Form
* **Form element:** `aria-label="Create new support ticket"`.
* **Required Fields:** Each `<label>` associated via `for`/`id` pairing. Required inputs carry `aria-required="true"` and `required` attributes.
* **Inline Validation Errors:** Error `<p>` elements carry `role="alert"` and `aria-live="assertive"` so they are announced immediately on validation failure. Each error is linked to its input via `aria-describedby="[field-id]-error"`.
* **Character Counter:** `aria-live="polite"` on the character count span so updates are announced without interrupting the user mid-typing.
* **Attachment Drop Zone:** `role="region"`, `aria-label="File attachment drop zone"`. File removal buttons use `aria-label="Remove [filename]"`.
* **Submit Button (Busy State):** `aria-busy="true"` and `aria-label="Submitting ticket, please wait"` during the pending request.

### 9.4 My Tickets Screen
* **Search Input:** `aria-label="Search tickets by number or summary"`, `type="search"`.
* **Filter Selects:** Each filter carries a descriptive `aria-label` (e.g., `aria-label="Filter by category"`, `aria-label="Filter by priority"`, `aria-label="Filter by status"`).
* **Data Table `<table>`:** `aria-label="My submitted tickets"`. Sortable column headers use `<button>` with `aria-sort="ascending"` or `"descending"` attributes toggled on activation.
* **Pagination Controls:** Wrapped in `<nav aria-label="Ticket list pagination">`. Previous/Next buttons have `aria-label="Go to previous page"` / `"Go to next page"`. Current page button carries `aria-current="page"`.
* **Empty State:** `role="status"` on the empty illustration container so the "No tickets submitted yet" message is surfaced to screen readers.
* **No-Results State:** `aria-live="polite"` on the results region so that filter-induced no-results messages are announced when the list updates.

### 9.5 Ticket Detail Screen
* **Back Link:** `aria-label="Back to My Tickets list"`.
* **Status Badge:** `aria-label="Current status: New"` (value injected dynamically per ticket).
* **Priority Badge:** `aria-label="Requested priority: Medium"` (value injected dynamically).
* **Attachment List `<ul>`:** `aria-label="Ticket attachments"`. Each list item identifies the file by name.
  * **Download Button:** `aria-label="Download [filename]"`.
  * **Remove Button (Active):** `aria-label="Remove attachment [filename]"`.
  * **Removed Badge:** `aria-label="Attachment removed on [date]. Reason: [reason]"` on the muted metadata row.
* **Add Attachment Button (Disabled at limit):** `aria-disabled="true"` and `aria-label="Cannot add more attachments — maximum of 5 reached"` when the 5-attachment cap is reached.

### 9.6 Soft-Removal Confirmation Modal
* **Modal Container:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`.
* **Modal Title:** `id="modal-title"` to link with the dialog's `aria-labelledby`.
* **Reason Textarea:** `aria-label="Removal reason"`, `aria-required="true"`, `aria-describedby="removal-reason-error"` when error is displayed.
* **Focus Management:** On modal open, focus is moved to the Reason textarea. On modal close (cancel or confirm), focus returns to the triggering Remove button.
* **Keyboard Trap:** Tab and Shift+Tab cycle only between modal elements while open. `Escape` key closes the modal and returns focus.
