# e-Hotels Web App Implementation Log

## Project Overview

This repository contains the e-Hotels project for CSI 2132, with a PostgreSQL data layer (Drizzle ORM schema + SQL migrations) and a Next.js frontend.

Phase 1 objective was to establish a production-quality frontend foundation before implementing data workflows:
- Component system setup (shadcn UI)
- Responsive app shell
- Dashboard landing screen
- Role switch control for Customer vs Employee (UI state only)

The backend schema, triggers, and views are already present and unchanged in this phase.

## Role Policy Alignment + Dashboard Cleanup (April 2026)

- Updated customer capability guards to include admin access for role-policy parity:
  - `src/app/browse-hotels/page.tsx`
  - `src/app/bookings/new/page.tsx`
  - `src/app/workflows/actions.ts` (`createBookingAction`)
- Updated app navigation filtering in `src/components/app/app-shell.tsx`:
  - Admin now sees customer + employee + admin feature links.
  - Added explicit `Bookings` shortcut for customer/admin roles.
- Kept `src/middleware.ts` as a session gate only while aligning protected route role metadata with policy.
- Replaced outdated dashboard placeholders and stale phase notes in `src/app/page.tsx` with role-aware quick actions:
  - customer: browse, booking, reports
  - employee: workflows, reports
  - admin: customer/admin management + customer/employee/reporting shortcuts

## Transient Mutation Feedback Refresh (April 2026)

- Added reusable client flash feedback in `src/components/app/flash-message.tsx`.
- The flash component hydrates `notice`/`error` query-param messages into dismissible banners, auto-dismisses success quickly, and keeps errors visible longer.
- Implemented URL cleanup that removes only `notice` and `error` while preserving other query params (for example search/sort filters), so redirected page context remains intact.
- Replaced static pinned success/error badges with transient flash banners across:
  - `src/app/admin/customers/page.tsx`
  - `src/app/admin/employees/page.tsx`
  - `src/app/admin/hotels/page.tsx`
  - `src/app/admin/rooms/page.tsx`
  - `src/app/browse-hotels/page.tsx`
  - `src/app/bookings/new/page.tsx`
  - `src/app/employee/workflows/page.tsx`

## Background Refresh Reimplementation (April 2026)

- Reimplemented the backdrop as a true global composition in `src/app/globals.css` using `body`, `body::before`, and `body::after` so authenticated shell pages and public pages (including sign-in) share the same ambient treatment.
- Removed shell-scoped ambient rendering from `.app-frame::before` to prevent inconsistent layering and visual regression between app-shell pages and non-shell pages.
- Enforced explicit non-repeating settings (`background-repeat`, `background-size`, `background-position`) for all backdrop layers to avoid tiled/striped artifacts on wide screens.

## Background + Booking Button Fix (April 2026)

- Reworked the global background treatment in `src/app/globals.css` to remove the tiled app-frame overlay and replace it with a softer, non-repeating ambient composition.
- Kept the warm hospitality direction but shifted it toward a more premium, layered feel with lighter depth and fewer decorative distractions.
- Updated the booking page back link in `src/app/bookings/new/page.tsx` to use a server-safe class string instead of importing `buttonVariants` from the client button module.

## Background + Hydration Stability Pass (April 2026)

- Tightened global background settings in `src/app/globals.css` with explicit `background-repeat`, `background-size`, and `background-position` on both body and app-frame ambient layers.
- Expanded ambient pseudo-element bounds to avoid edge clipping artifacts on wide screens.
- Removed competing page-specific sign-in backdrop in `src/app/auth/sign-in/page.tsx` so all major screens share one consistent global backdrop.
- Added targeted `suppressHydrationWarning` to form-heavy primitives in `src/components/ui/button.tsx` and `src/components/ui/input.tsx` to tolerate extension-injected attributes (for example `fdprocessedid`) while keeping root layout mitigation in place.

## Auth + Hydration Fix (April 2026)

- Added targeted hydration mitigation at root layout level by enabling `suppressHydrationWarning` on `html` and `body` in `src/app/layout.tsx` to tolerate browser-extension-injected attributes while preserving normal app semantics.
- Centralized password hashing/verification format into shared utility `src/lib/password.ts`, reused by both `src/lib/auth.ts` and `src/db/seed.ts` to keep credential format consistent.
- Hardened `loginUser` in `src/lib/auth.ts` with explicit error codes:
  - `INVALID_CREDENTIALS`
  - `AUTH_SCHEMA_MISSING`
  - `AUTH_UNEXPECTED`
- Updated `src/app/api/auth/sign-in/route.ts` to return status + code mapping (401/503/500) and updated `src/app/auth/sign-in/page.tsx` to show clearer user-facing messages by failure type.
- Made demo user creation in `src/db/seed.ts` robust and repeatable using per-user upsert on email conflict, refreshing password hash, role links, and timestamps.

## Completed Work In This Unit (Phase 8 - UI Micro-Polish Pass)

### 1) Visual rhythm and density improvements
- Tightened small-screen spacing and heading scales on core screens:
  - `src/components/app/app-shell.tsx`
  - `src/app/page.tsx`
  - `src/app/auth/sign-in/page.tsx`
- Reduced visual heaviness while preserving hierarchy using shorter spacing steps and cleaner text sizing on mobile.
- Kept the Phase 7 warm hospitality direction intact.

### 2) Consistent loading, empty, and error states
- Added reusable state utilities in `src/app/globals.css`:
  - `state-panel`, `state-loading`, `state-empty`, `state-error`
- Applied these states to report pages for consistent UX:
  - `src/app/reports/rooms-per-area/page.tsx`
  - `src/app/reports/hotel-capacity/page.tsx`
- Kept sign-in error messaging consistent with the same state treatment language.

### 3) Table readability refinements
- Updated shared table primitives in `src/components/ui/table.tsx` to improve readability app-wide:
  - stronger header contrast
  - sticky table header behavior
  - subtle zebra separation
  - increased row and cell spacing
- These changes improve dense CRUD/report tables without changing data logic.

### 4) Role accents and interaction affordance
- Added restrained role accent utility classes in `src/app/globals.css`:
  - `role-accent-customer`
  - `role-accent-employee`
  - `role-accent-admin`
- Updated shell badges to use these semantic accents instead of ad-hoc color values.
- Strengthened button hierarchy/feedback in `src/components/ui/button.tsx` with shorter transition timing and clearer hover/active behavior.

### 5) Accessibility checks performed
- Maintained global visible focus outlines (`:focus-visible`) and did not reduce focus contrast.
- Improved touch ergonomics by increasing default control heights:
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/select.tsx`
- Reduced motion intensity and removed broad automatic section animations in favor of targeted, short-duration reveals.

### 6) Remaining optional polish ideas
- Add compact/comfortable density toggle for admin-heavy tables.
- Add skeleton row placeholders for long report loads where table shape is known.
- Standardize inline form validation microcopy style across all CRUD dialogs.

## Completed Work In This Unit (Phase 7 - Visual Theme Refresh)

### 1) Visual direction
- Refreshed the application look from cool grayscale to a warm, professional hospitality tone.
- Introduced layered surfaces and subtle atmospheric gradients to improve depth without reducing readability.
- Preserved existing routes, auth flows, API behavior, and data interactions.

### 2) Theme token system
- Updated global CSS tokens in `src/app/globals.css` to include cohesive semantic variables:
  - surface hierarchy: `--surface-1`, `--surface-2`, `--surface-3`
  - text hierarchy: `--text-strong`, `--text-muted`
  - semantic status colors: `--success`, `--warning`, `--danger`
  - accent and border refinement: `--accent-soft`, `--border`, `--ring`
- Added matching dark-theme counterparts for the same semantic tokens.
- Added reusable visual utility classes (`surface-panel`, `surface-strong`, `motion-reveal`, `stagger-list`) for consistent styling.

### 3) Screen-level updates
- Updated `src/components/app/app-shell.tsx`:
  - Warmed sidebar/header panels with new surface tokens and soft shadows.
  - Rebalanced role badge colors to avoid purple-heavy contrast.
  - Kept all session fetching, navigation, and sign-out logic intact.
- Updated `src/app/page.tsx`:
  - Reworked dashboard hero, KPI cards, and secondary panels to use the new depth and spacing hierarchy.
  - Added restrained motion (reveal + stagger) for initial content load.
  - Kept all links, labels, and content structure unchanged.
- Updated `src/app/auth/sign-in/page.tsx`:
  - Shifted from dark slate-only styling to a warm, layered sign-in presentation.
  - Improved form surface contrast and consistency with app-wide tokens.
  - Preserved sign-in API behavior, error handling, and routing.

### 4) Accessibility and interaction notes
- Reinforced visible focus states for interactive controls globally (`:focus-visible` outline and offset).
- Maintained clear text contrast between foreground and muted content on both light and dark themes.
- Kept motion subtle and short to avoid distraction, while preserving readability and spatial orientation.

## Completed Work In This Unit (Phase 6 - Authentication & Role Enforcement)

### 1) Authentication schema
- Added `user` table to database schema (`src/db/schema.ts`)
- Fields: userId (PK), email (unique), passwordHash, role (enum: customer/employee/admin), customerId (FK), employeeSsn (FK), timestamps
- Users link to either a customer or employee profile based on role
- Role constraint enforced at DB level with CHECK

### 2) Password hashing and session management
- Created `src/lib/auth.ts` with authentication utilities:
  - `hashPassword()`: PBKDF2-based password hashing with salt and iterations (100k)
  - `verifyPassword()`: Constant-time password verification
  - `setSessionCookie()`: Creates secure httpOnly cookies with JWT-like signed tokens
  - `getSession()`: Retrieves and verifies session from cookies
  - `clearSessionCookie()`: Logout functionality
  - `loginUser()`: Authenticates by email/password
  - `logoutUser()`: Clears session
  - `requireRole()` and `requireAuth()`: Authorization helpers for route protection
- Sessions encoded as HMAC-signed JSON tokens in base64 format
- httpOnly, secure (in production), sameSite=lax cookies
- 24-hour expiration with automatic renewal on session check

### 3) Sign-in flow
- Created public sign-in page: `src/app/auth/sign-in/page.tsx`
  - Email and password inputs
  - Error states with clear messaging
  - Demo credentials displayed for testing
  - Redirects to dashboard on success
  - Polished dark theme UI consistent with existing design
- Created API endpoint: `src/app/api/auth/sign-in/route.ts`
  - POST handler validates credentials
  - Calls `loginUser()` utility
  - Returns JSON response with success/error

### 4) Sign-out flow
- Created API endpoint: `src/app/api/auth/sign-out/route.ts`
  - POST handler calls `logoutUser()`
  - Clears session cookie
- Added sign-out button in AppShell profile dropdown
  - Calls `/api/auth/sign-out`
  - Redirects to sign-in page

### 5) Route middleware and protection
- Created `src/middleware.ts` for request-level route protection
  - Checks for session cookie on protected routes
  - Redirects unauthenticated users to `/auth/sign-in`
  - Basic role checks (full role validation at endpoint level)
  - Protected routes defined for: /admin, /employee, /reports, /browse-hotels, /bookings, /workflows
  - Also protects all `/api/*` routes except `/api/auth`
  - Non-blocking implementation (token validation happens server-side)

### 6) Session API endpoint
- Created `src/app/api/auth/session/route.ts`
  - GET endpoint returns current session data if authenticated
  - Returns 401 if not authenticated
  - Used by AppShell to fetch user info on page load

### 7) Updated AppShell for authenticated state
- Refactored `src/components/app/app-shell.tsx`:
  - Removed client-side RoleSwitch (role now set by authentication)
  - Added `useEffect` to fetch current session on mount
  - Displays authenticated user's email and role (color-coded: blue for customer, purple for employee, red for admin)
  - Shows user initials in avatar
  - Added sign-out button in profile dropdown
  - Updated sidebar to show "Logged in as {role}"
  - Responsive on mobile and desktop
  - Loading states during session fetch

### 8) Database seeding with test users
- Updated `src/db/seed.ts`:
  - Added crypto import for password hashing
  - Added `hashPassword()` utility function
  - Added three test users to seed data:
    - customer@example.com (customer role, linked to first customer)
    - employee@example.com (employee role, linked to first employee)
    - admin@example.com (admin role, linked to first employee)
  - All use password: `password123` (plain text for demo)
  - Users created during `npm run db:seed`
- Auth setup dependency: if `relation "user" does not exist` appears, run DB sync first:
  - `psql -U postgres -d ehotels -f src/db/migrations.sql` (creates auth table safety block)
  - then `npm run db:seed`

### 9) Authorization enforcement
- Route-level: Middleware redirects unauthenticated users to sign-in
- Role-level: Middleware performs basic role checks; full validation at API endpoints
- Protected routes return 401/403 for unauthorized access
- Admin pages (/admin/*) require admin role
- Employee routes (/employee/*) require employee or admin role
- Reports (/reports/*) accessible to all authenticated users
- Customer browse (/browse-hotels) requires customer role

## Completed Work In This Unit (Phase 5 - SQL View Browsing Pages)

### 1) SQL view integration with Drizzle schema
- Added Drizzle ORM table definitions for two existing database views:
  - `roomsPerArea`: Maps to the `rooms_per_area` view (area, available_rooms)
  - `hotelCapacity`: Maps to the `hotel_capacity` view (hotel_id, address, chain, rating, room breakdown, capacity)
- Added TypeScript type exports `RoomsPerArea` and `HotelCapacity` for type safety.
- Views are read-only and leverage existing DB aggregation queries.

### 2) Report query utilities
- Created `src/lib/reports.ts` with reusable typed queries:
  - `getRoomsPerArea()`: Fetches all areas with available room counts
  - `getHotelCapacity()`: Fetches all hotels with capacity breakdown
  - `searchHotelCapacity()`: Supports search by chain name or hotel address
  - `getHotelCapacityByRating()`: Filters by star rating
- All queries include proper error handling and logging.

### 3) SQL view browsing pages
- **Rooms per Area** (`src/app/reports/rooms-per-area/page.tsx`):
  - Displays available room counts per geographic area (hotel address)
  - Shows summary stats: total available rooms and average per area
  - Table sorted by availability (highest first)
  - Loading and error state handling
  - Updated live from the database view

- **Hotel Capacity** (`src/app/reports/hotel-capacity/page.tsx`):
  - Displays total rooms and breakdown by capacity type (single/double/suite/family)
  - Shows total guest capacity (computed from room types)
  - Summary stats: total hotels, total rooms, average rooms/hotel, total capacity
  - Filters: search by chain name or address, filter by star rating
  - Clean table with star rating display and capacity badge
  - Loading, error, and empty state handling

### 4) Backend API routes
- Created two API endpoints for client-side data fetching:
  - `/api/reports/rooms-per-area`: GET endpoint to fetch rooms per area data
  - `/api/reports/hotel-capacity`: GET endpoint to fetch hotel capacity data
- Both routes include error handling and return JSON responses.
- Routes fetch from Drizzle queries and convert view data to JSON for client consumption.

### 5) Report navigation and UI polish
- Added `ReportsNav` component (`src/components/reports/reports-nav.tsx`) for navigation between the two report pages.
- Added "Reports" link to main app-shell navigation (`src/components/app/app-shell.tsx`) with BarChart3 icon.
- Both report pages use AppShell layout and include ReportsNav for inter-report navigation.
- Consistent styling with shadcn components: cards, tables, badges, input filters, select dropdowns.
- Professional loading spinners, error alerts, and empty state messaging.

### 6) Data consistency and revalidation notes
- Report pages are read-only, no mutations needed.
- Data is fetched client-side on page load and reflects live view state.
- If admin mutations modify rooms, hotels, or bookings, related views automatically refresh on next report page load.
- For production use, consider adding Next.js cache invalidation after admin mutations (e.g., `revalidateTag('reports')`).

## Completed Work In This Unit (Phase 3 - Full CRUD Management)

### 1) SQL view integration with Drizzle schema
- Added Drizzle ORM table definitions for two existing database views:
  - `roomsPerArea`: Maps to the `rooms_per_area` view (area, available_rooms)
  - `hotelCapacity`: Maps to the `hotel_capacity` view (hotel_id, address, chain, rating, room breakdown, capacity)
- Added TypeScript type exports `RoomsPerArea` and `HotelCapacity` for type safety.
- Views are read-only and leverage existing DB aggregation queries.

### 2) Report query utilities
- Created `src/lib/reports.ts` with reusable typed queries:
  - `getRoomsPerArea()`: Fetches all areas with available room counts
  - `getHotelCapacity()`: Fetches all hotels with capacity breakdown
  - `searchHotelCapacity()`: Supports search by chain name or hotel address
  - `getHotelCapacityByRating()`: Filters by star rating
- All queries include proper error handling and logging.

### 3) SQL view browsing pages
- **Rooms per Area** (`src/app/reports/rooms-per-area/page.tsx`):
  - Displays available room counts per geographic area (hotel address)
  - Shows summary stats: total available rooms and average per area
  - Table sorted by availability (highest first)
  - Loading and error state handling
  - Updated live from the database view

- **Hotel Capacity** (`src/app/reports/hotel-capacity/page.tsx`):
  - Displays total rooms and breakdown by capacity type (single/double/suite/family)
  - Shows total guest capacity (computed from room types)
  - Summary stats: total hotels, total rooms, average rooms/hotel, total capacity
  - Filters: search by chain name or address, filter by star rating
  - Clean table with star rating display and capacity badge
  - Loading, error, and empty state handling

### 4) Backend API routes
- Created two API endpoints for client-side data fetching:
  - `/api/reports/rooms-per-area`: GET endpoint to fetch rooms per area data
  - `/api/reports/hotel-capacity`: GET endpoint to fetch hotel capacity data
- Both routes include error handling and return JSON responses.
- Routes fetch from Drizzle queries and convert view data to JSON for client consumption.

### 5) Report navigation and UI polish
- Added `ReportsNav` component (`src/components/reports/reports-nav.tsx`) for navigation between the two report pages.
- Added "Reports" link to main app-shell navigation (`src/components/app/app-shell.tsx`) with BarChart3 icon.
- Both report pages use AppShell layout and include ReportsNav for inter-report navigation.
- Consistent styling with shadcn components: cards, tables, badges, input filters, select dropdowns.
- Professional loading spinners, error alerts, and empty state messaging.

### 6) Data consistency and revalidation notes
- Report pages are read-only, no mutations needed.
- Data is fetched client-side on page load and reflects live view state.
- If admin mutations modify rooms, hotels, or bookings, related views automatically refresh on next report page load.
- For production use, consider adding Next.js cache invalidation after admin mutations (e.g., `revalidateTag('reports')`).

## Completed Work In This Unit (Phase 3 - Full CRUD Management)


### 1) Admin CRUD pages added
- Added full CRUD module pages:
  - `src/app/admin/customers/page.tsx`
  - `src/app/admin/employees/page.tsx`
  - `src/app/admin/hotels/page.tsx`
  - `src/app/admin/rooms/page.tsx`
- Added `src/app/admin/page.tsx` redirect to the customers module as the admin entry point.
- Added shared admin navigation component `src/components/admin/admin-nav.tsx`.

### 2) Server Actions for all entity mutations
- Added centralized Server Actions in `src/app/admin/actions.ts` for create/update/delete operations on:
  - customers
  - employees
  - hotels
  - rooms
- Added strict server-side validation for required fields, numeric ranges, date format, SSN format, enum-like fields, and foreign key references.
- Added friendly mutation error handling for FK/unique/check violations.

### 3) CRUD list UX and supporting components
- Added search + sort controls on all four modules.
- Added list tables with action controls (edit/delete) per row.
- Added dialog-based create/edit forms using shadcn components.
- Added support primitives:
  - `src/components/ui/table.tsx`
  - `src/components/ui/textarea.tsx`
  - `src/components/ui/dialog.tsx`

### 4) Data consistency and revalidation
- Added path revalidation after each mutation for affected admin and dependent pages.
- Preserved schema constraints and introduced extra protection for room deletions with live booking/renting references.
- Wired shell navigation to make admin modules reachable from the app shell.

## Completed Work In This Unit (Phase 2 - Booking + Employee Workflows)

### 1) Customer booking mutation flow
- Added route `src/app/bookings/new/page.tsx` for customer booking creation.
- Added booking handoff from browse results (`Book This Room`) in `src/app/browse-hotels/page.tsx`.
- Implemented server action `createBookingAction` in `src/app/workflows/actions.ts`.
- Enforced strict validation for dates, references, and room overlap checks.

### 2) Employee check-in conversion flow
- Added route `src/app/employee/workflows/page.tsx` for operational workflows.
- Implemented booking-to-renting conversion action `convertBookingToRentingAction`.
- Conversion now creates renting records and removes the booking in one transaction.
- Preserved overlap checks and schema constraints during conversion.

### 3) Employee direct renting flow
- Implemented `createDirectRentingAction` for walk-in customers.
- Added validation for customer, employee, room/hotel references, date order, and overlaps.

### 4) Employee payment entry flow
- Implemented `recordRentingPaymentAction` to update payment amount/date/status on existing renting rows.
- Added validation for renting reference, payment fields, and allowed status values.

### 5) Routing and page revalidation
- Revalidated affected routes after each mutation (`/browse-hotels`, `/bookings/new`, `/employee/workflows`).
- Updated shell navigation so Reservations now routes to employee workflows.

## Completed Work In This Unit (Phase 2 - Browse Hotels)

### 1) First real customer read-only flow
- Added route `src/app/browse-hotels/page.tsx`.
- Built a complete Browse Hotels page that queries live room availability.
- Kept the flow read-only with no booking/renting mutations.

### 2) Typed reusable query layer
- Added `src/lib/browse-hotels.ts`.
- Implemented typed parsing of URL search params into filter state.
- Implemented reusable DB query function for available rooms based on date overlap logic.
- Reused the existing schema/query patterns and leveraged `hotel_capacity` view for total room count filtering.

### 3) Filter UI and live updates
- Added `src/components/browse-hotels/browse-hotel-filters.tsx`.
- Added all required filters:
  - start date
  - end date
  - room capacity
  - area
  - hotel chain
  - hotel category
  - total number of rooms in hotel
  - price range
- Wired filters to URL query params and automatic result refresh when values change.

### 4) Shell navigation wiring
- Updated `src/components/app/app-shell.tsx` to use real route links.
- Replaced Browse Hotels placeholder nav with `/browse-hotels`.
- Added route-aware active nav highlighting.

### 5) UI support primitives
- Added `src/components/ui/input.tsx`.
- Added `src/components/ui/select.tsx`.

## Completed Work In This Phase

### 1) shadcn UI integration
- Initialized shadcn in this Next.js app.
- Added component registry config in `components.json`.
- Added utility helper in `src/lib/utils.ts`.
- Added shadcn/Tailwind-compatible styling layers in `src/app/globals.css`.
- Added reusable UI components:
  - `src/components/ui/button.tsx`
  - `src/components/ui/card.tsx`
  - `src/components/ui/badge.tsx`
  - `src/components/ui/avatar.tsx`
  - `src/components/ui/dropdown-menu.tsx`
  - `src/components/ui/sheet.tsx`
  - `src/components/ui/separator.tsx`
  - `src/components/ui/toggle.tsx`
  - `src/components/ui/toggle-group.tsx`

### 2) Application shell and responsive navigation
- Created role switch component: `src/components/app/role-switch.tsx`.
- Created full app shell: `src/components/app/app-shell.tsx`.
- Implemented desktop left sidebar with navigation and role controls.
- Implemented mobile top bar + slide-out menu using shadcn Sheet.
- Added profile dropdown and top-level status/notification controls.

### 3) Dashboard landing page
- Replaced starter Next.js page in `src/app/page.tsx`.
- Built a polished dashboard landing UI with:
  - Hero/status section
  - KPI cards
  - Phase 2 preview panel
  - Explicit guardrails/non-goals panel
- Kept all business actions disabled to avoid premature workflow implementation.

### 4) Visual and structural refinement
- Updated app fonts and metadata in `src/app/layout.tsx`.
- Added atmospheric background treatment and staged section entrance animation in `src/app/globals.css`.
- Kept component structure modular for upcoming feature phases.

## Running Development Log

- Reviewed project constraints and existing files: AGENTS.md, README.md, package.json, schema.ts, migrations.sql, app layout/page, globals.
- Confirmed Next.js local docs note and verified App Router usage remains compatible for these updates.
- Installed and initialized shadcn.
- Added missing UI primitives needed for shell + dashboard.
- Implemented role state switch (customer/employee), responsive navigation shell, and dashboard content.
- Created this implementation log for ongoing phase tracking.
- Implemented first read-only customer flow at `/browse-hotels` with live filter-driven availability results.
- Updated shell navigation to connect dashboard and browse routes.
- Implemented server-action write workflows for booking creation, booking conversion to renting, direct renting creation, and payment entry.
- Added dedicated customer and employee workflow pages while preserving non-goal boundaries.

## Pending Phases

### Phase 7 (recommended next)
- Build route-level reservation detail history pages for customer self-service visibility.
- Add dashboard analytics or KPI rolls-up from report views.
- Implement password reset flow for users.
- Add audit logging for sensitive admin operations.

### Phase 8
- Role-based UI customization: hide/show nav items based on authenticated role.
- Session timeout warnings and automatic refresh.
- Multi-factor authentication (optional, for security hardening).
- Database backup and recovery automation.

### Phase 9
- Hardening and polish: test coverage, edge case handling, and deployment readiness.
- Performance optimization if queries become slow at scale.
- Archive cleanup workflows: automated archival of old completed rentings/bookings.
- Rate limiting on API endpoints to prevent brute force.

## Risks And Assumptions

- Assumption: PASSWORD_SECRET environment variable set for production (currently using dev default).
- Assumption: HTTPS enforced in production for secure cookie transmission.
- Assumption: Database is secured and only accessible from trusted networks.
- Risk: If database is compromised, password hashes are at risk. Consider salting improvements or bcrypt for future.
- Risk: No session invalidation across multiple browsers (same user can have multiple active sessions).
- Risk: No OAuth/social login; email/password only (suitable for course project, not production SaaS).
- Assumption: Test users created during seed are for demo only and should be removed/changed in production.
- Risk: Password reset flow not yet implemented; admin must reset via direct database update or future reset endpoint.
- Risk: No role changes after user creation; would require separate admin panel or API to update user roles.
- Risk: Session cookie revocation not yet implemented; user logout doesn't invalidate existing routes until cookie expires or hits /api/auth/session.

## Agent Handoff Notes

### Core Principles (Updated for Auth)
1. All protected routes require session validation through middleware + API endpoint checks.
2. User role is immutable after account creation (see risks).
3. AppShell fetches session on mount and auto-updates; respect this pattern for other auth-dependent components.
4. Use `requireAuth()` or `requireRole()` from `src/lib/auth.ts` in Server Actions and API routes.
5. Always use httpOnly cookies for sessions; never store auth tokens in localStorage.
6. Keep auth logic centralized in `src/lib/auth.ts`; do not duplicate.

### File Organization (Updated for Auth)
- **Auth Logic**: `src/lib/auth.ts` (utilities, session management, crypto)
- **Auth Pages**: `src/app/auth/sign-in/page.tsx`
- **Auth Routes**: `/api/auth/sign-in`, `/api/auth/sign-out`, `/api/auth/session`
- **Middleware**: `src/middleware.ts` (route protection, basic role checks)
- **Database**: `src/db/schema.ts` includes `user` table definition

### Authentication Flow
1. User navigates to app or protected route
2. Middleware checks for session cookie
3. If no cookie: redirect to `/auth/sign-in`
4. User enters email + password
5. POST `/api/auth/sign-in` validates credentials
6. On success: set httpOnly cookie with signed token
7. AppShell fetches `/api/auth/session` and displays user info
8. Protected pages render (middleware allowed request through)
9. On sign-out: POST `/api/auth/sign-out`, redirect to sign-in

### For Next Teams

**Authentication Hardening**:
1. Add rate limiting to `/api/auth/sign-in` (e.g., 5 attempts per minute per IP)
2. Implement password reset flow via email token
3. Add optional 2FA (TOTP or email OTP)
4. Implement session revocation on user role change

**Session Management**:
1. Add middleware option to require fresh auth for sensitive operations (e.g., CRUD age < 5 min)
2. Implement cross-tab session logging out (SharedWorker or broadcast channel)
3. Add "remember me" option with separate long-lived refresh token

**UI/UX**:
1. Show session expiry warning 5 min before timeout
2. Auto-hide nav items based on `session.role` (currently all shown)
3. Add password change endpoint in profile settings
4. Add account security audit log (login times, role changes)

**Testing**:
1. Add unit tests for `hashPassword()` and `verifyPassword()`
2. Add integration tests for `/api/auth/sign-in` and sign-out flows
3. Edge case: attempt to access admin route with customer role (should be blocked)
4. Edge case: session expired while user is on page (should show re-login prompt)

**Production Checklist**:
- [ ] Set `SESSION_SECRET` environment variable (don't use dev default)
- [ ] Verify HTTPS is enforced in production
- [ ] Verify database user isolation (app should not use root user)
- [ ] Set secure cookie flags: `secure`, `httpOnly`, `sameSite`
- [ ] Consider SSL/TLS certificate for HTTPS
- [ ] Run penetration tests on auth endpoints
- [ ] Document password reset process for admins
- [ ] Add rate limiting and DDoS protection

### Recent Decisions
- Used PBKDF2 with 100k iterations for password hashing (sufficient for educational project; bcrypt recommended for production)
- Sessions stored as signed JWT-like tokens in cookies (simpler than database session store; tokens are self-validating)
- Middleware does NOT validate tokens (Edge Runtime limitation); role validation happens at endpoint level
- AppShell refactored to be authentication-aware; removed client-side RoleSwitch (role now server-determined)
- Sign-in page shows demo credentials for testing (remove in production or environment-gate)

### Testing the Auth System
After running `npm run db:seed`, test users are:
- **customer@example.com** / password123 → Has access to `/browse-hotels`, `/bookings`, `/reports`
- **employee@example.com** / password123 → Has access to `/employee/workflows`, `/reports`
- **admin@example.com** / password123 → Has access to `/admin/*`, `/employee/workflows`, `/reports`

Try:
1. Sign in as each role
2. Attempt to access restricted routes (should redirect)
3. Sign out from each role
4. Try invalid credentials
5. Verify AppShell shows correct role and user email

