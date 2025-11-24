# AFREQ Delivery Tracking System

A comprehensive container shipping and delivery management web application for AFREQ Logistics handling China-to-Ghana shipments.

## 🚀 Project Overview

This system provides two major interfaces:

### 1. **User Side (Customers)**
- Track shipment status (China warehouse → In transit → Ghana → Ready for pickup → Delivered)
- View estimated arrival dates
- See item details with photos, measurements (CBM), weight, cost, tracking numbers
- Read announcements from admin/team
- View invoices (shipping, handling, storage, pickup charges)
- Submit support requests (missing items, wrong delivery, general support)

### 2. **Team Side (Operations Dashboard)**

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

## 🛠️ Tech Stack

**Frontend:**
- **React 19.2.0** - UI Library
- **TypeScript 5.9.3** - Type Safety
- **Vite 7.2.4** - Build Tool
- **React Router 7.9.6** - Routing
- **Bootstrap 5** - CSS Framework
- **Popper.js** - Tooltip & Popover positioning
- **Keen Template** - Bootstrap 5 based admin dashboard
- **ESLint 9** - Code Quality

**Backend & Storage:**
- **Airtable** - Database (NoSQL, spreadsheet-like interface)
- **Cloudinary** - Image storage and transformations
- **Axios** - HTTP client for API calls

## 📦 Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🔧 Backend Setup

### Option 1: Demo Mode (No Setup Required)
The app works out of the box with demo/mock data. Perfect for development!

### Option 2: Full Setup with Airtable & Cloudinary

**Step 1: Set up Airtable (Database)**
- Follow the detailed guide: [AIRTABLE_SETUP.md](AIRTABLE_SETUP.md)
- Create tables, add sample data, get API credentials
- Takes ~15 minutes

**Step 2: Set up Cloudinary (Image Storage)**
- Follow the detailed guide: [CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md)
- Create account, get credentials, set up upload preset
- Takes ~10 minutes

**Step 3: Configure Environment Variables**
1. Copy `.env.example` to `.env`
2. Add your credentials:
```env
# Airtable
VITE_AIRTABLE_API_KEY=your_api_key
VITE_AIRTABLE_BASE_ID=your_base_id

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
VITE_CLOUDINARY_API_KEY=your_api_key
```
3. Restart dev server

## 🔐 Demo Accounts

The application includes demo authentication for testing:

- **Customer:** `customer@afreq.com`
- **China Team:** `china@afreq.com`
- **Ghana Team:** `ghana@afreq.com`
- **Admin:** `admin@afreq.com`

(Password can be anything for demo purposes)

## 📁 Project Structure

```
frontend/
├── src/
│   ├── assets/              # Keen template assets (CSS, JS, images)
│   │   ├── css/
│   │   ├── js/
│   │   ├── media/
│   │   └── plugins/
│   ├── components/
│   │   ├── layout/          # Header, Sidebar, MainLayout
│   │   ├── common/          # ProtectedRoute, shared components
│   │   ├── user/            # Customer-specific components
│   │   ├── china-team/      # China team components
│   │   ├── ghana-team/      # Ghana team components
│   │   └── admin/           # Admin components
│   ├── pages/
│   │   ├── auth/            # Login, authentication pages
│   │   ├── user/            # Customer pages
│   │   ├── china-team/      # China team pages
│   │   ├── ghana-team/      # Ghana team pages
│   │   └── admin/           # Admin pages
│   ├── context/             # React Context (AuthContext)
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   │   ├── calculations.ts  # CBM, weight, dimension conversions
│   │   └── helpers.ts       # Date formatting, status helpers
│   ├── App.tsx              # Main app with routing
│   └── main.tsx             # Application entry point
├── index.html               # HTML template with Keen assets
└── package.json
```

## 🎨 Styling

**IMPORTANT:** All styling uses Keen template assets from the `src/assets/` folder:

- Core styles: `assets/css/style.bundle.css`
- Global plugins: `assets/plugins/global/plugins.bundle.{css,js}`
- Bootstrap 5 icons available via `bi-*` classes
- Custom Keen components available

Do not use external CDNs or additional CSS frameworks.

## 🔧 Key Features Implemented

### ✅ Completed
1. Project structure and folder organization
2. TypeScript type definitions for all entities
3. Authentication system with role-based access
4. React Router setup with protected routes
5. Main layout with sidebar and header
6. Role-based navigation menu
7. Utility functions for CBM calculation, currency formatting
8. Demo login page with Keen styling
9. Placeholder pages for all user roles

### 🚧 To Be Implemented
1. **User Side Features:**
   - Status tracking table with filters
   - Estimated arrival calendar view
   - Item details with photo gallery
   - Announcements feed
   - Invoice list and detail view
   - Support request form with email integration

2. **China Team Module:**
   - Bulk image upload with folder organization
   - Image grid with click-to-add-details
   - Item receiving form with CBM auto-calculation
   - Packaging and consolidation interface
   - Carton number generation

3. **Ghana Team Module:**
   - Barcode/QR code scanning interface
   - Item sorting dashboard
   - Damage/missing item marking
   - Delivery management

4. **Admin Features:**
   - Status management dashboard
   - Customer management
   - Container management
   - Analytics and reporting

5. **Backend Integration:**
   - API endpoints for all operations
   - Database schema
   - File upload handling
   - Email notification system

## 📐 Business Logic

### CBM Calculation
```typescript
// When dimensions are in cm
CBM = (Length × Width × Height) / 1,000,000

// When dimensions are in inches
CBM = (Length × Width × Height) / 61,024
```

### Status Flow
```
China Warehouse → In Transit → Arrived Ghana → Ready for Pickup → Delivered/Picked Up
```

## 🎯 Next Steps

1. Connect to backend API (replace mock data in AuthContext)
2. Implement data tables for status, items, invoices
3. Build bulk upload interface with image preview
4. Add form validation and error handling
5. Implement search and filtering
6. Add real-time updates for status changes
7. Integrate email service for support requests

## 📝 Development Guidelines

- Follow the existing folder structure
- Use TypeScript types from `src/types/`
- Use utility functions from `src/utils/`
- Use Keen template classes for styling
- Reference Keen HTML files in `src/` folders for UI patterns
- Keep components focused and reusable
- Use React hooks for state management
- Implement proper error handling

## 🤝 Contributing

Refer to [CLAUDE.md](CLAUDE.md) for detailed architecture notes and development guidelines.

## 📄 License

Keen Template: Commercial license from KeenThemes
Application: Proprietary - AFREQ Logistics
