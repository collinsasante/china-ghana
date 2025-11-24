# AFREQ - Quick Start Guide

## 🚀 Getting Started (5 minutes)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:5174**

### 3. Login with Demo Accounts

Choose one of these demo accounts to test different user roles:

| Role | Email | Features |
|------|-------|----------|
| **Customer** | `customer@afreq.com` | Track shipments, view items, invoices, support |
| **China Team** | `china@afreq.com` | Receive items, bulk upload, packaging |
| **Ghana Team** | `ghana@afreq.com` | Sorting, scanning, delivery |
| **Admin** | `admin@afreq.com` | Full access to all modules |

*Password can be anything - this is demo authentication*

## 📁 Project Structure Overview

```
frontend/src/
├── assets/          # Keen template (CSS, JS, images) - DO NOT MODIFY
├── components/      # Reusable React components
│   ├── layout/      # Header, Sidebar, MainLayout
│   └── common/      # Shared components
├── pages/           # Page components for each route
│   ├── auth/        # Login page
│   ├── user/        # Customer pages
│   ├── china-team/  # China operations pages
│   ├── ghana-team/  # Ghana operations pages
│   └── admin/       # Admin pages
├── context/         # React Context (AuthContext)
├── types/           # TypeScript definitions
├── utils/           # Helper functions
│   ├── calculations.ts  # CBM, conversions
│   └── helpers.ts       # Formatters, generators
├── App.tsx          # Main routing
└── main.tsx         # Entry point
```

## 🎯 Current Status

### ✅ What's Working
- Authentication with role-based access
- Navigation sidebar with role-specific menu items
- Routing with protected routes
- Main layout (header + sidebar)
- Theme switching (light/dark)
- Placeholder pages for all modules

### 🚧 What's Next to Build

**Priority 1 - Customer Features:**
1. Status tracking table with real data
2. Item details with photo gallery
3. Invoice list and details
4. Support request form

**Priority 2 - China Team:**
1. Bulk image upload interface
2. Item receiving form with CBM calculation
3. Packaging module

**Priority 3 - Ghana Team:**
1. Scanning interface
2. Sorting dashboard

## 🔧 Common Tasks

### Add a New Page

1. Create page component in `src/pages/{role}/`
2. Add route in `src/App.tsx`
3. Add menu item in `src/components/layout/Sidebar.tsx`

### Use CBM Calculator

```typescript
import { calculateCBM } from '../utils/calculations';

const cbm = calculateCBM(length, width, height, 'cm');
```

### Format Currency

```typescript
import { formatCedis, formatUSD } from '../utils/calculations';

const price = formatCedis(100.50);  // "GH₵ 100.50"
```

### Check User Role

```typescript
import { useAuth } from '../context/AuthContext';

const { user, hasRole } = useAuth();

if (hasRole('admin')) {
  // Admin-only code
}
```

## 🎨 Styling with Keen Template

Use Bootstrap 5 classes and Keen-specific classes:

```tsx
// Cards
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Title</h3>
  </div>
  <div className="card-body">
    Content
  </div>
</div>

// Buttons
<button className="btn btn-primary">Primary</button>
<button className="btn btn-success">Success</button>

// Badges
<span className="badge badge-light-success">Success</span>
<span className="badge badge-light-warning">Warning</span>

// Icons (Bootstrap Icons)
<i className="bi bi-truck fs-2"></i>
<i className="bi bi-box-arrow-in-down fs-3"></i>
```

## 📝 Development Tips

1. **Don't modify files in `src/assets/`** - These are Keen template files
2. **Use TypeScript types** from `src/types/` for all data structures
3. **Reference HTML templates** in `src/` folders for UI inspiration
4. **Keep components small** - Break down complex UIs into smaller components
5. **Use utility functions** instead of duplicating logic

## 🐛 Troubleshooting

### Port already in use
Vite will automatically try another port (5174, 5175, etc.)

### Styles not loading
Make sure `index.html` has these lines:
```html
<link href="/src/assets/plugins/global/plugins.bundle.css" rel="stylesheet" />
<link href="/src/assets/css/style.bundle.css" rel="stylesheet" />
```

### Module not found errors
Run `npm install` to ensure all dependencies are installed

## 📚 Learn More

- [README.md](README.md) - Full project documentation
- [CLAUDE.md](CLAUDE.md) - Architecture and development guidelines
- [Keen Docs](https://preview.keenthemes.com/keen/docs) - Template documentation

## 🆘 Need Help?

1. Check existing HTML templates in `src/` for UI patterns
2. Review type definitions in `src/types/index.ts`
3. Look at existing components in `src/components/`
4. Refer to utility functions in `src/utils/`
