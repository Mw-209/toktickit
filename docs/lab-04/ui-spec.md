# Lab 4 UI Specification

**Project:** TokTickIT — Actions Taken, Dashboards, and Final Regression  
**Design Language:** Zen Green

---

## 1. General Design Rules

- All new screens follow existing Zen Green design tokens (colors, typography, spacing, border-radius, shadow).
- Reuse existing component patterns: Ticket cards, tab bars, badge variants, button styles, form fields, table rows, loading skeletons, empty states, and error banners.
- No horizontal page scrolling on any viewport.
- All interactive elements must be keyboard-operable and have visible focus rings.
- All icons and status indicators must have accessible labels (aria-label or visible text); do not rely on color alone.
- Remove any placeholder text, TODO comments, or unfinished controls before release.

---

## 2. IT Staff Dashboard

### 2.1 Layout
- Full-page view accessible from the main navigation (IT Staff and Admin roles only).
- Top section: 4 metric cards in a responsive grid (2 columns on tablet, 1 column on mobile, 4 on desktop).
- Bottom section: a compact list of recently updated Tickets (max 5 rows), each linking to Ticket Detail.

### 2.2 Metric Cards

| Card | Metric | Drill-Down Destination |
|------|--------|----------------------|
| Unassigned Tickets | Count of Tickets with no owner | Ticket Queue filtered to unassigned |
| My Tickets | Count of Tickets owned by current user | Ticket Queue filtered to current user |
| Tickets by Status | Mini breakdown (badge list) per status | Ticket Queue filtered by status |
| Recently Updated | Count / list of Tickets updated in last 7 days | Ticket Queue sorted by updatedAt desc |

### 2.3 States
- **Loading:** skeleton placeholder for each card.
- **Empty:** card shows "0" with a short message, not hidden.
- **Forbidden:** full-page 403 message if a non-Staff role accesses this route.
- **API Error:** banner at top of page; cards show "—" instead of crashing.

---

## 3. Requester Dashboard

### 3.1 Layout
- Full-page view accessible from the main navigation (Requester role only).
- 4 metric cards in a responsive grid, same breakpoints as IT Staff Dashboard.
- No recent Ticket list (existing My Tickets screen covers that).

### 3.2 Metric Cards

| Card | Metric | Drill-Down Destination |
|------|--------|----------------------|
| Total Open Tickets | Count of own Tickets not in Resolved/Closed/Cancelled | My Tickets filtered to open |
| Waiting for Me | Count of own Tickets in "Waiting for Requester" status | My Tickets filtered to that status |
| Recently Updated | Count of own Tickets updated in last 7 days | My Tickets sorted by updatedAt desc |
| Recently Resolved | Count of own Tickets moved to Resolved in last 7 days | My Tickets filtered to Resolved |

### 3.3 States
- Same loading, empty, forbidden, and error states as IT Staff Dashboard.
- Ownership protection: backend enforces; Requester cannot see other Requesters' data even by URL manipulation.

---

## 4. Actions Taken on Ticket Detail

### 4.1 Placement
- Below the existing Ticket Detail sections (Description, Attachments, Comments, Internal Notes).
- Section heading: "Actions Taken".

### 4.2 List View (All Roles)
- Table or card list, ordered by actionDateTime descending.
- Columns: Date/Time | Description | Result | Performed By | Follow-Up Required | Follow-Up Note | Attachment Notes.
- Follow-Up Required displayed as a badge (Yes / No).
- Empty state: "No actions have been recorded yet."

### 4.3 Create Mode (IT Staff / Admin Only)
- "Add Action" button visible only to IT Staff and Admin.
- Inline form or modal with the following fields:

| Field | Input Type | Required | Notes |
|-------|-----------|----------|-------|
| Action Date/Time | datetime-local | Yes | Defaults to now |
| Action Description | textarea | Yes | |
| Result | textarea | Yes | |
| Follow-Up Required | checkbox | Yes | Default unchecked |
| Follow-Up Note | textarea | Conditional | Visible and required when Follow-Up Required is checked |
| Attachment Notes | textarea | No | |

- Performed By: read-only display of authenticated user's name (not editable).
- Submit button: "Save Action".
- Cancel button: discards changes, returns to list.
- Validation errors appear inline below the relevant field.

### 4.4 Edit Mode (IT Staff / Admin Only)
- Edit icon on each Action Taken row (IT Staff who created it, or Admin).
- Opens same form pre-filled with existing values.
- Submit button: "Update Action".

### 4.5 Requester View
- Sees full list in read-only mode.
- No "Add Action" button and no edit icons.

---

## 5. Ticket Workflow Controls

### 5.1 Status Selector
- Displayed on IT Staff Ticket Detail.
- Dropdown or segmented control showing only permitted next statuses for the current user's role and current Ticket status.
- Disabled (grayed out) if no transitions are available.

### 5.2 Requester "Appears Resolved" Button
- Shown to Requesters on their Ticket Detail when Ticket is in Resolved status.
- Label: "Confirm problem appears resolved".
- Clicking sends the advisory flag to the backend; status badge does NOT change.
- Button is replaced by a read-only "You indicated the problem appears resolved" label after submission.

### 5.3 Feedback
- Successful transition: status badge on the page refreshes to the new status; toast or inline confirmation shown.
- Failed transition (403/400): error banner shown; status badge unchanged.
- 409 Conflict: error banner "This Ticket was updated by someone else. Please refresh and try again."

---

## 6. Navigation Updates

- Add "Dashboard" item to the navigation for IT Staff and Admin (links to IT Staff Dashboard).
- Add "Dashboard" item to the navigation for Requester (links to Requester Dashboard).
- Active page indication must be visible (highlighted nav item).
- Dashboard routes must redirect unauthenticated users to Login.

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 768 px | 1-column, stacked |
| Tablet | 768–1024 px | 2-column cards, collapsible nav |
| Desktop | > 1024 px | Full sidebar nav, 4-column cards |

---

## 8. Visual and Accessibility Checklist

- [ ] Zen Green design tokens used for all new colors, fonts, and spacing.
- [ ] All metric cards have labels, numeric values, and accessible drill-down links.
- [ ] Follow-Up Note field is hidden when not required (not just disabled).
- [ ] Edit and Create forms have correct `<label>` elements for every input.
- [ ] Validation error messages are associated with their field via `aria-describedby`.
- [ ] Modal dialogs (if used) trap focus and have a visible close control.
- [ ] Status badges use both color and text (not color alone).
- [ ] No content is clipped, overlapping, or causing horizontal scroll on any breakpoint.
- [ ] Keyboard Tab order is logical on all new screens.
- [ ] All icon buttons have aria-label or adjacent visible text.
