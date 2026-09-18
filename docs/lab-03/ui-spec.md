# Lab 3 UI Specification

**Project:** TokTickIT — Users, Roles, IT Staff Ticketing, and Admin Screens  
**Design Language:** Zen Green Theme (continued from Lab 2)

---

## 1. Design Tokens (Unchanged from Lab 2)

| Token | Value | Usage |
|-------|-------|-------|
| Primary Green | `#006B3C` | Header, primary buttons, brand emphasis |
| Secondary Green | `#0B7A46` | Active tabs, hover states, accents |
| Pale Green | `#EAF6EF` | Selected cards, success callouts, highlights |
| Page Background | `#F5F7F6` | App background |
| Card Surface | `#FFFFFF` | Card/panel backgrounds |
| Border | `#E2E8F0` | Card borders, input borders |
| Box Shadow | `0 1px 3px rgba(0,0,0,0.06)` | Cards |
| Error Red | `#DC2626` | Validation messages, error states |
| Warning Amber | `#D97706` | Warning badges |
| Text Primary | `#1A202C` | Main body text |
| Text Secondary | `#718096` | Labels, timestamps, metadata |

---

## 2. Status Badge Colors

| Status | Background | Text |
|--------|-----------|------|
| NEW | `#EAF6EF` | `#006B3C` |
| OPEN | `#DBEAFE` | `#1D4ED8` |
| IN_PROGRESS | `#FEF3C7` | `#92400E` |
| WAITING_FOR_REQUESTER | `#FDE68A` | `#78350F` |
| RESOLVED | `#D1FAE5` | `#065F46` |
| CLOSED | `#E5E7EB` | `#374151` |
| REOPENED | `#FCE7F3` | `#9D174D` |
| CANCELLED | `#FEE2E2` | `#991B1B` |

## 3. Priority Badge Colors

| Priority | Background | Text |
|----------|-----------|------|
| LOW | `#F0FDF4` | `#166534` |
| MEDIUM | `#FEF9C3` | `#854D0E` |
| HIGH | `#FEF3C7` | `#92400E` |
| URGENT | `#FEE2E2` | `#991B1B` |

## 4. Role Badge Colors

| Role | Background | Text |
|------|-----------|------|
| REQUESTER | `#EFF6FF` | `#1D4ED8` |
| IT_STAFF | `#FDF4FF` | `#7E22CE` |
| ADMINISTRATOR | `#FFF7ED` | `#C2410C` |

---

## 5. Application Shell (Lab 3)

### 5.1 Global Header (Modified from Lab 2)
- Left: TokTickIT logo + product name
- Right: Authenticated user name + Role badge + **Logout button**
- Dev Requester selector is **removed entirely**
- Role-specific navigation links shown only for permitted destinations:
  - REQUESTER: "Create Ticket", "My Tickets"
  - IT_STAFF: "Ticket Queue", "My Tickets" (their own as Requester if applicable)
  - ADMINISTRATOR: "User Management"

### 5.2 Role-Specific Navigation
```
REQUESTER:    [Create Ticket]  [My Tickets]
IT_STAFF:     [Ticket Queue]
ADMINISTRATOR:[User Management]
```

---

## 6. Screen Specifications

### 6.1 Login Screen (`/login`)

**Mode:** Form entry

**Layout:** Centered card (max-width 440px) on `#F5F7F6` background

**Components:**
- TokTickIT logo + "IT Support Portal" heading
- Email input (type=email, autocomplete=email, required)
- Password input (type=password, autocomplete=current-password, required)
- "Sign In" primary button (full width, `#006B3C`)
- Busy state: button disabled + spinner
- Error state: inline error below form (generic: "Invalid credentials or inactive account")

**Validation:**
- Email: required, valid format
- Password: required (non-empty)

**Responsive:** Centered on all sizes; inputs full-width inside card

**Feedback States:**
| State | Display |
|-------|---------|
| Idle | Empty form |
| Loading | Button disabled + "Signing in…" + spinner |
| Error | Red alert below form, form re-enabled |
| Inactive account | Same generic error (no account-existence exposure) |

---

### 6.2 Change Password Screen (`/change-password`)

**Mode:** Form entry (accessible only when `mustChangePassword = true`)

**Layout:** Centered card (max-width 440px)

**Components:**
- Heading: "Set Your New Password"
- Subtext: "You must change your password before continuing."
- New Password input (type=password, minlength=8)
- Confirm Password input (type=password)
- "Save New Password" primary button
- Busy + error + success states

**Validation (inline, field-level):**
- New Password: min 8 characters
- Confirm Password: must match New Password

**Success:** Redirect to the appropriate home screen for the user's role

---

### 6.3 IT Staff Ticket Queue (`/staff/tickets`)

**Access:** IT_STAFF, ADMINISTRATOR only — 403 page for other roles

**Layout:**
- Desktop (≥1024px): Full-width table with toolbar above
- Tablet (768–1023px): Scrollable table
- Mobile (<768px): Card stack

**Toolbar (above table/cards):**
- Search input (placeholder: "Search ticket number or summary…")
- Filter: Status dropdown (All Statuses | NEW | OPEN | IN_PROGRESS | WAITING_FOR_REQUESTER | RESOLVED | CLOSED | REOPENED | CANCELLED)
- Filter: IT Priority dropdown (All Priorities | LOW | MEDIUM | HIGH | URGENT)
- Filter: Category dropdown (All Categories | …seeded categories)
- Filter: Owner dropdown (All | Unassigned | …active IT Staff names)
- "Apply" button or real-time filtering (specify in api-spec)

**Desktop Table Columns:**
| Column | Sortable |
|--------|----------|
| Ticket No. | ✓ |
| Created | ✓ |
| Summary | — |
| Category | — |
| Req. Priority | ✓ |
| IT Priority | ✓ |
| Status | — (badge) |
| Owner | — |
| Last Updated | ✓ |
| Action | — ("View" button) |

**Mobile Card:** Shows Ticket No., Summary (truncated), Status badge, IT Priority badge, Owner, Last Updated

**Pagination:** "Showing X–Y of Z tickets" + Previous/Next buttons + page size selector (10/25/50)

**Empty/No-Results:** Zen Green empty-state illustration + message
**Loading:** Skeleton rows
**Error:** Alert banner with retry

---

### 6.4 IT Staff Ticket Detail (`/staff/tickets/:id`)

**Access:** IT_STAFF, ADMINISTRATOR only

**Layout (Desktop):** Two-column — left: Ticket info + Attachments; right: Actions + Comments + Notes  
**Layout (Mobile):** Single column stacked

#### Section A: Ticket Information (read-only)
- Ticket Number, Created Date, Last Updated
- Summary (read-only)
- Description (read-only)
- Category, Related System
- Requested Priority badge
- Requester Name

#### Section B: IT Staff Operations Panel
- **Owner:** Current owner name (or "Unassigned") + "Claim" button (if unassigned) / "Reassign" dropdown (if assigned)
- **IT Priority:** Dropdown selector (LOW / MEDIUM / HIGH / URGENT), Save button
- **Status:** Dropdown showing only permitted next transitions + "Update Status" button with optional confirmation for terminal states (RESOLVED, CLOSED, CANCELLED)
- **Resolve Indication:** Read-only indicator if Requester has flagged "problem appears resolved" (shows `resolveIndicatedAt` timestamp)

#### Section C: Attachments
- Same Lab 2 attachment list (download active, metadata for removed)
- IT Staff can view but not upload/remove in this screen (Requester manages attachments)

#### Section D: Public Comments
- Thread of comments (author name + role badge, timestamp, content)
- Post comment textarea (max 2,000 chars) + "Post Comment" button
- Visible to all authenticated roles

#### Section E: Internal Notes
- Visually distinct section with amber/purple tint background (`#FDF4FF`) and "🔒 Internal — IT Staff & Admin only" label
- Thread of notes (author name, timestamp, content)
- Post note textarea (max 2,000 chars) + "Add Note" button
- Hidden from Requester view

**Feedback:** Loading skeleton, save busy state, inline validation, success toast

---

### 6.5 Requester Ticket Detail (Modified from Lab 2)

**Changes from Lab 2:**
- Dev Requester identity removed; identity from session
- Add **Public Comments section** (same as 6.4 Section D, excluding Internal Notes)
- Add **"Problem Appears Resolved" button** (shown only if ticket is not RESOLVED/CLOSED/CANCELLED, and only to ticket owner)
  - Confirmation dialog: "Are you sure you want to indicate the problem appears resolved? IT Staff will be notified."
  - After click: button replaced with timestamp indicator "You indicated this appears resolved on [date]"

---

### 6.6 Administrator User Management (`/admin/users`)

**Access:** ADMINISTRATOR only — 403 page for other roles

**Layout:** Single-column page

**Toolbar:**
- Search input (placeholder: "Search by name or email…")
- Optional Role filter dropdown (All Roles | REQUESTER | IT_STAFF | ADMINISTRATOR)
- "+ Create User" button (right-aligned, primary)

**User List Table:**
| Column | Notes |
|--------|-------|
| Name | Sortable A→Z |
| Email | — |
| Role | Badge |
| Status | "Active" (green) / "Inactive" (grey) badge |
| Action | "Edit" button |

**No user deletion column** (per lab sheet exclusions)

**Create User Modal:**
- Name (required)
- Email (required, unique)
- Role (required, one of: REQUESTER / IT_STAFF / ADMINISTRATOR)
- Initial Password (required, min 8 chars)
- Confirm Password (required, matches)
- Active toggle (default: active)
- "Create User" button + Cancel

**Edit User Modal:**
- Name, Email, Role, Active toggle (editable)
- "Set New Initial Password" expandable section (optional — only fill if resetting)
- "Save Changes" button + Cancel
- Safety error: if trying to deactivate own account → inline error "You cannot deactivate your own account"
- Safety error: if removing last admin → inline error "Cannot deactivate the last active Administrator"

**Feedback:** Loading list skeleton, save busy, validation inline, success toast, API error alert

---

## 7. Responsive Rules (All Lab 3 Screens)

| Breakpoint | Behavior |
|-----------|---------|
| Mobile < 768px | Single column, stacked sections, card lists |
| Tablet 768–1023px | Two-column header, scrollable tables |
| Desktop ≥ 1024px | Full multi-column layout |

All inputs, buttons, and modals must be usable without horizontal overflow on mobile.

---

## 8. Accessibility Requirements (Unchanged from Lab 2)

- All interactive elements have unique, descriptive `id` attributes.
- Form labels associated with inputs via `htmlFor`/`id`.
- Error messages linked to inputs via `aria-describedby`.
- Focus rings visible on keyboard navigation.
- Color is not the sole indicator of status (badge text always present).
- Modals trap focus and close on Escape key.
