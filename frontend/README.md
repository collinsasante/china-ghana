# AFREQ Logistics - Delivery Tracking System

A comprehensive container shipping and delivery management web application for AFREQ Logistics handling China-to-Ghana shipments.

## 🚀 Quick Start

```bash
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

## 🛠️ Tech Stack

- **React 19.2.0** - UI Library
- **TypeScript 5.9.3** - Type Safety
- **Vite 7.2.4** - Build Tool & Dev Server
- **React Router 7.9.6** - Client-side Routing
- **Bootstrap 5** - CSS Framework
- **Custom Admin Dashboard** - Based on Bootstrap 5

## 📁 Project Structure

```
src/
├── assets/              # Static assets (CSS, JS, images, plugins)
├── components/
│   ├── layout/          # Header, Sidebar, MainLayout
│   ├── common/          # ProtectedRoute, shared components
│   ├── user/            # Customer-specific components
│   ├── china-team/      # China team components
│   ├── ghana-team/      # Ghana team components
│   └── admin/           # Admin components
├── pages/
│   ├── auth/            # Login, authentication pages
│   ├── user/            # Customer pages
│   ├── china-team/      # China team pages
│   ├── ghana-team/      # Ghana team pages
│   └── admin/           # Admin pages
├── context/             # React Context (AuthContext)
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
│   ├── calculations.ts  # CBM, weight, dimension conversions
│   └── helpers.ts       # Date formatting, status helpers
├── App.tsx              # Main app with routing
└── main.tsx             # Application entry point
```

## 🔐 Demo Accounts

- **Customer:** `customer@afreq.com`
- **China Team:** `china@afreq.com`
- **Ghana Team:** `ghana@afreq.com`
- **Admin:** `admin@afreq.com`

(Password can be anything for demo purposes)

## 📐 Key Features

### Customer Interface
- Track shipment status across the entire pipeline
- View estimated arrival dates
- See item details with photos, measurements (CBM), weight, cost
- Read announcements
- View invoices
- Submit support requests

### China Team Module
- Receive items with bulk image uploads
- Enter item details with auto CBM calculation
- Package & consolidate items
- Generate carton numbers
- Update shipping status

### Ghana Team Module
- Scan items to confirm arrival
- Assign items to customers
- Mark damaged/missing items
- Update delivery/pickup status

### Admin Dashboard
- Central status management
- Customer management
- Container management
- Analytics and reporting

## 🎨 Styling Guidelines

All styling uses assets from the `src/assets/` folder:

- Core styles: `assets/css/style.bundle.css`
- Global plugins: `assets/plugins/global/plugins.bundle.{css,js}`
- Bootstrap 5 classes and components
- Custom dashboard components

## 📝 Development Guidelines

- Follow TypeScript strict mode
- Use types from `src/types/`
- Use utility functions from `src/utils/`
- Keep components focused and reusable
- Use React hooks for state management
- Implement proper error handling

## 🔗 Related Documentation

- [Main Project README](../README.md) - Full project overview
- [CLAUDE.md](../CLAUDE.md) - Architecture notes and development guidelines
- [AIRTABLE_SETUP.md](../AIRTABLE_SETUP.md) - Backend database setup
- [CLOUDINARY_SETUP.md](../CLOUDINARY_SETUP.md) - Image storage setup

## 📄 License

Application: Proprietary - AFREQ Logistics
