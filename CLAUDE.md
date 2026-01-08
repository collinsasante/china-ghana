# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AFREQ Delivery Tracking System** - A comprehensive container shipping and delivery management web application for AFREQ Logistics handling China-to-Ghana shipments.

This is a **React + TypeScript + Vite** frontend application built with a **Bootstrap 5 Admin Dashboard Template**. The system has two major interfaces:

### 1. **User Side (Customers)**
Customers can:
- Track shipment status (China warehouse → In transit → Ghana → Ready for pickup → Delivered)
- View estimated arrival dates
- See item details with photos, measurements (CBM), weight, cost, tracking numbers
- Read announcements from admin/team
- View invoices (shipping, handling, storage, pickup charges)
- Submit support requests (missing items, wrong delivery, general support)

### 2. **Team Side (Operations Dashboard)**
Internal staff can manage:

**China Team Module:**
- Receive items with bulk image uploads (organized by date/container number)
- Enter item details (name, tracking, dimensions with auto CBM conversion, weight, USD/cedis pricing)
- Package & consolidate items under customers
- Generate carton numbers
- Update shipping status

**Ghana Team Module:**
- Scan items to confirm arrival
- Assign items to customers
- Mark damaged/missing items
- Update delivery/pickup status

**Status Management:**
- Central dashboard for status updates across the entire shipping pipeline

**Important**: This codebase contains template HTML files in `frontend/src/` that serve as UI references. **All styles and JavaScript must use assets from `frontend/src/assets/` folder** (CSS in `assets/css/`, JS in `assets/js/`, plugins in `assets/plugins/`).

## Development Commands

All commands should be run from the `frontend/` directory:

```bash
# Start development server
npm run dev

# Build for production (runs TypeScript type checking + Vite build)
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component (currently minimal)
│   ├── index.html            # Main HTML template (from the template)
│   ├── apps/                 # Static HTML files for various app modules
│   │   ├── calendar.html
│   │   ├── chat/
│   │   ├── contacts/
│   │   ├── customers/
│   │   ├── ecommerce/
│   │   ├── file-manager/
│   │   ├── inbox/
│   │   ├── invoices/
│   │   ├── projects/
│   │   ├── subscriptions/
│   │   ├── support-center/
│   │   └── user-management/
│   ├── dashboards/           # Pre-built dashboard HTML files
│   │   ├── bidding.html
│   │   ├── ecommerce.html
│   │   ├── logistics.html
│   │   ├── marketing.html
│   │   ├── online-courses.html
│   │   ├── projects.html
│   │   └── social.html
│   ├── layouts/              # Layout HTML variations
│   │   ├── dark-header.html
│   │   ├── dark-sidebar.html
│   │   ├── light-header.html
│   │   └── light-sidebar.html
│   ├── pages/                # Static page templates
│   │   ├── about.html
│   │   ├── apps/
│   │   ├── blog/
│   │   ├── careers/
│   │   ├── contact.html
│   │   ├── faq.html
│   │   ├── social/
│   │   └── user-profile/
│   ├── authentication/       # Auth-related HTML templates
│   │   ├── email/
│   │   ├── extended/
│   │   ├── general/
│   │   └── layouts/
│   ├── account/              # Account management templates
│   ├── assets/               # Static assets
│   └── utilities/            # Utility components and modals
│       ├── modals/
│       ├── search/
│       └── wizards/
├── public/
│   └── vite.svg
└── package.json
```

## Technology Stack

- **React 19.2.0** with React DOM
- **TypeScript 5.9.3** with strict mode enabled
- **Vite 7.2.4** as build tool
- **ESLint 9** with TypeScript and React plugins
- **Bootstrap 5** based admin dashboard template

## Key Architecture Notes

### Static HTML Migration Strategy

The codebase contains **540+ static HTML files** from the template. These files include:
- Complete page layouts with sidebar/header variations (dark/light themes)
- Dashboard templates for different domains (e-commerce, logistics, marketing, etc.)
- Application modules (chat, calendar, file manager, invoices, etc.)
- Authentication flows, modals, wizards, and utility components

**Development approach**: When building new features, refer to the corresponding HTML file to understand the UI structure and component hierarchy before implementing the React version.

### TypeScript Configuration

- Strict mode is enabled with comprehensive linting rules
- Uses `"moduleResolution": "bundler"` for modern module resolution
- Enforces `noUnusedLocals`, `noUnusedParameters`, and `noUncheckedSideEffectImports`
- JSX transform: `react-jsx` (no need to import React in components)

### No Routing or State Management

Currently, there is **no routing library** (React Router) or global state management (Redux, Zustand, etc.) configured. These will need to be added as the application grows.

### Template Assets

**CRITICAL**: All styling and JavaScript MUST be loaded from the `frontend/src/assets/` folder:

**Core Assets:**
- `assets/css/style.bundle.css` - Main styles (Bootstrap 5 based)
- `assets/plugins/global/plugins.bundle.css` - Global plugin styles
- `assets/plugins/global/plugins.bundle.js` - Global plugins bundle
- `assets/js/scripts.bundle.js` - Core JavaScript
- `assets/js/widgets.bundle.js` - Widget components

**Plugin Assets (when needed):**
- DataTables: `assets/plugins/custom/datatables/datatables.bundle.{css,js}`
- FullCalendar: `assets/plugins/custom/fullcalendar/fullcalendar.bundle.{css,js}`
- Lightbox: `assets/plugins/custom/fslightbox/fslightbox.bundle.js`
- Form Repeater: `assets/plugins/custom/formrepeater/formrepeater.bundle.js`

**Media Assets:**
- Logos: `assets/media/logos/`
- Avatars: `assets/media/avatars/`
- Auth backgrounds: `assets/media/auth/`
- Icons/SVGs: `assets/media/svg/`
- Country flags: `assets/media/flags/`

**Asset Loading in React:**
1. Import CSS files in component files or main.tsx
2. For JavaScript bundles, load via `<script>` tags in index.html or use dynamic imports
3. Reference images using relative paths from components (e.g., `/src/assets/media/logos/logo.png`)
4. DO NOT use CDN links or external sources - use local assets only

## Development Notes

### TypeScript Import Requirements

**CRITICAL:** Always use the `type` keyword for type-only imports and explicit path:

```typescript
// ✅ Correct
import type { User, UserRole } from '../types/index';
import type { ShipmentStatus } from '../types/index';

// ❌ Wrong - Will cause runtime errors
import { User, UserRole } from '../types';
```

**Reason:** Vite requires explicit type imports to avoid runtime module resolution errors.

### Building React Components from HTML

1. Locate the relevant HTML file in `src/apps/`, `src/dashboards/`, or `src/pages/`
2. Analyze the structure, identifying reusable components
3. Create React components with proper TypeScript types
4. Replace inline scripts with React hooks and state management
5. Convert Bootstrap data attributes to React props where applicable

### ESLint Configuration

The project uses the modern flat config format (`eslint.config.js`). It includes:
- TypeScript ESLint recommended rules
- React Hooks rules (ensures proper hook usage)
- React Refresh rules (for HMR compatibility)

### Theme Mode Handling

The template includes theme mode switching logic (light/dark/system). When implementing theme support in React, consider:
- Using `localStorage.getItem("data-bs-theme")` for persistence
- Setting `data-bs-theme` attribute on `document.documentElement`
- System preference detection via `window.matchMedia("(prefers-color-scheme: dark)")`

## AFREQ-Specific Business Logic

### CBM (Cubic Meter) Calculation
**Formula**: `CBM = (Length × Width × Height) / 1,000,000` (when dimensions in cm) or `CBM = (Length × Width × Height) / 61,024` (when dimensions in inches)

**Implementation**: Auto-calculate CBM when dimensions are entered in the China Team item receiving form.

### Status Flow Pipeline
```
China Warehouse → In Transit → Arrived Ghana → Ready for Pickup → Delivered/Picked Up
```

### Item Data Structure
Each item should track:
- Item name
- Tracking number (unique identifier)
- Dimensions (L × W × H) in inches or cm
- CBM (auto-calculated)
- Weight (kg or lbs)
- Cost (USD and cedis equivalent)
- Photos (multiple images per item)
- Container number
- Receiving date
- Customer assignment
- Current status
- Carton number (for consolidated packages)

### Bulk Image Upload Workflow (China Team)
1. Upload images in folders organized by: `{Date}/{Container Number}/`
2. Display uploaded images in a grid
3. Click image → Open form to add item details
4. Associate form data with the clicked image
5. Save item with photo reference

### Support Request Email Integration
When customers submit support requests, the system should send an email to AFREQ support team with:
- Customer info
- Request type (missing item, wrong delivery, general)
- Description
- Related tracking numbers
