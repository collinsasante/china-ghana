# Template Matching TODO

This document outlines which React components need to be updated to match their corresponding HTML templates.

## ✅ Completed

1. **Login Page** - [frontend/src/pages/auth/Login.tsx](frontend/src/pages/auth/Login.tsx)
   - ✅ Now matches [sign-in.html](frontend/src/authentication/layouts/corporate/sign-in.html)
   - Includes Google/Apple login buttons
   - Proper separator and styling
   - Demo credentials notice box

2. **Status Tracking Page** - [frontend/src/pages/user/StatusPage.tsx](frontend/src/pages/user/StatusPage.tsx)
   - ✅ Now matches [apps/ecommerce/sales/listing.html](frontend/src/apps/ecommerce/sales/listing.html)
   - Card header with search input and magnifier icon
   - Date range picker with clear button
   - Status dropdown filter
   - DataTable structure with proper classes (table align-middle table-row-dashed)
   - Checkbox column for bulk actions
   - Clickable tracking numbers with hover effects
   - Eye icon button for viewing details
   - Search functionality (by item name and tracking number)
   - Status badges with proper colors
   - Responsive toolbar layout

## 🔄 Pages That Need Template Matching

### Authentication Pages

3. **Sign Up Page** - [frontend/src/pages/auth/SignUp.tsx](frontend/src/pages/auth/SignUp.tsx)
   - Template: [sign-up.html](frontend/src/authentication/layouts/corporate/sign-up.html)
   - Needs: Corporate layout with left side image, terms checkbox, social login buttons

4. **Reset Password** - [frontend/src/pages/auth/ResetPassword.tsx](frontend/src/pages/auth/ResetPassword.tsx)
   - Template: [reset-password.html](frontend/src/authentication/layouts/corporate/reset-password.html)
   - Needs: Email input with back to login link

5. **New Password** - [frontend/src/pages/auth/NewPassword.tsx](frontend/src/pages/auth/NewPassword.tsx)
   - Template: [new-password.html](frontend/src/authentication/layouts/corporate/new-password.html)
   - Needs: Password confirmation fields with strength indicator

### Dashboard Pages

6. **Main Dashboard** - [frontend/src/pages/admin/DashboardPage.tsx](frontend/src/pages/admin/DashboardPage.tsx)
   - ✅ Now matches [dashboards/logistics.html](frontend/src/dashboards/logistics.html)
   - Toolbar with breadcrumbs and page title
   - Ki-duotone icons throughout (package, people, category, check-circle, shop, delivery, geolocation, document, information, cross-circle, call)
   - Stats cards with hover effects and color coding
   - Status breakdown cards with clickable navigation
   - Quick Actions panel with primary buttons
   - Proper HTML comments matching template
   - Loading state with centered spinner

### Customer Pages

7. **Item Details** - [frontend/src/pages/user/ItemDetails.tsx](frontend/src/pages/user/ItemDetails.tsx)
   - Template: [apps/ecommerce/sales/details.html](frontend/src/apps/ecommerce/sales/details.html)
   - Needs: Photo gallery, item specifications, tracking timeline

8. **Invoices** - [frontend/src/pages/user/Invoices.tsx](frontend/src/pages/user/Invoices.tsx)
   - Template: [apps/invoices/view/invoice-1.html](frontend/src/apps/invoices/view/invoice-1.html)
   - Needs: Invoice layout with line items, totals, payment info

9. **Support Requests** - [frontend/src/pages/user/Support.tsx](frontend/src/pages/user/Support.tsx)
   - Template: [apps/support-center/tickets/create.html](frontend/src/apps/support-center/tickets/create.html)
   - Needs: Ticket creation form with file uploads

### China Team Pages

3. **Item Receiving** - [frontend/src/pages/china-team/ReceivingPage.tsx](frontend/src/pages/china-team/ReceivingPage.tsx)
   - ✅ Now matches [apps/ecommerce/catalog/add-product.html](frontend/src/apps/ecommerce/catalog/add-product.html)
   - Two-column layout (aside + main)
   - Card flush styling with py-4
   - Receiving date card in sidebar
   - Upload progress card with status indicator
   - Media upload with FileUpload component
   - Ki-duotone icons (information, check-circle, time, cross)
   - Notice boxes with dashed borders
   - Image gallery grid with proper card structure
   - Status badges with icons
   - Bulk upload functionality maintained

4. **Container Management** - [frontend/src/pages/china-team/ContainerManagementPage.tsx](frontend/src/pages/china-team/ContainerManagementPage.tsx)
    - ✅ Now matches [apps/ecommerce/sales/listing.html](frontend/src/apps/ecommerce/sales/listing.html)
    - Toolbar with breadcrumbs and action buttons
    - Stats cards with Ki-duotone icons (package, cube-3, information, chart-line-up)
    - Card flush styling with proper headers
    - DataTable structure (table align-middle table-row-dashed fs-6 gy-5)
    - Form controls (form-control-solid, form-select-solid)
    - Symbol-based photo display with fallback icons
    - Accordion containers with expand/collapse
    - Badge styling for status and metadata
    - Proper HTML comments matching template

### Ghana Team Pages

5. **Item Sorting** - [frontend/src/pages/ghana-team/ItemSorting.tsx](frontend/src/pages/ghana-team/ItemSorting.tsx)
    - Template: [apps/ecommerce/catalog/products.html](frontend/src/apps/ecommerce/catalog/products.html)
    - Needs: Grid/list view with scanning functionality

6. **Delivery Management** - [frontend/src/pages/ghana-team/DeliveryManagement.tsx](frontend/src/pages/ghana-team/DeliveryManagement.tsx)
    - Template: [apps/ecommerce/sales/listing.html](frontend/src/apps/ecommerce/sales/listing.html)
    - Needs: Delivery tracking with customer assignment

### Layout Components

7. **Header** - [frontend/src/components/layout/Header.tsx](frontend/src/components/layout/Header.tsx)
    - Template: Extract from [index.html](frontend/src/index.html) header section
    - Needs: Search, notifications, user menu, theme toggle

8. **Sidebar** - [frontend/src/components/layout/Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx)
    - Template: Extract from [layouts/dark-sidebar.html](frontend/src/layouts/dark-sidebar.html)
    - Needs: Collapsible menu with icons, hover effects

## 📋 How to Update a Page

1. **Open the HTML template** referenced above
2. **Identify the main structure**:
   - Page wrapper classes
   - Card/panel layouts
   - Form structures
   - Table configurations
3. **Copy the HTML structure** to React component
4. **Convert to JSX**:
   - Change `class` to `className`
   - Close self-closing tags (`<img />`, `<input />`)
   - Convert inline styles to objects
   - Replace `href="#"` with proper routing
5. **Add React functionality**:
   - State management
   - Event handlers
   - Form validation
   - API integration
6. **Keep template classes intact** - Don't change Bootstrap/template CSS classes

## 🎨 Key Template Assets Used

All pages should use these assets:
- **CSS**: `/src/assets/css/style.bundle.css`
- **JS**: `/src/assets/js/scripts.bundle.js`
- **Plugins**: `/src/assets/plugins/global/plugins.bundle.js`
- **Icons**: Ki-duotone icons (`<i className="ki-duotone ki-*">`)

## 📝 Template Patterns

### Cards
```jsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Title</h3>
    <div className="card-toolbar">
      {/* Action buttons */}
    </div>
  </div>
  <div className="card-body">
    {/* Content */}
  </div>
</div>
```

### Buttons
```jsx
<button className="btn btn-primary">Primary</button>
<button className="btn btn-light-primary">Light Primary</button>
```

### Forms
```jsx
<div className="fv-row mb-8">
  <label className="form-label">Label</label>
  <input type="text" className="form-control bg-transparent" />
</div>
```

### Icons
```jsx
<i className="ki-duotone ki-shield-tick fs-2tx text-primary">
  <span className="path1"></span>
  <span className="path2"></span>
</i>
```

## 🚀 Priority Order

**High Priority** (Core functionality):
1. Login ✅
2. Status Tracking ✅
3. Item Receiving ✅
4. Container Management ✅
5. Dashboard ✅

**Medium Priority**:
6. Item Details
7. Invoices
8. Item Sorting
9. Delivery Management

**Low Priority**:
10. Sign Up
11. Reset/New Password
12. Support Requests

---

**Next Step**: All high-priority pages are complete! Move on to medium-priority pages (Item Details, Invoices, Item Sorting, Delivery Management).
