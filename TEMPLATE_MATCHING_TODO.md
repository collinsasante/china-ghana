# Template Matching TODO

This document outlines which React components need to be updated to match their corresponding HTML templates.

## ✅ Completed

- **Login Page** - [frontend/src/pages/auth/Login.tsx](frontend/src/pages/auth/Login.tsx)
  - Now matches [sign-in.html](frontend/src/authentication/layouts/corporate/sign-in.html)
  - Includes Google/Apple login buttons
  - Proper separator and styling
  - Demo credentials notice box

## 🔄 Pages That Need Template Matching

### Authentication Pages

1. **Sign Up Page** - [frontend/src/pages/auth/SignUp.tsx](frontend/src/pages/auth/SignUp.tsx)
   - Template: [sign-up.html](frontend/src/authentication/layouts/corporate/sign-up.html)
   - Needs: Corporate layout with left side image, terms checkbox, social login buttons

2. **Reset Password** - [frontend/src/pages/auth/ResetPassword.tsx](frontend/src/pages/auth/ResetPassword.tsx)
   - Template: [reset-password.html](frontend/src/authentication/layouts/corporate/reset-password.html)
   - Needs: Email input with back to login link

3. **New Password** - [frontend/src/pages/auth/NewPassword.tsx](frontend/src/pages/auth/NewPassword.tsx)
   - Template: [new-password.html](frontend/src/authentication/layouts/corporate/new-password.html)
   - Needs: Password confirmation fields with strength indicator

### Dashboard Pages

4. **Main Dashboard** - [frontend/src/pages/admin/Dashboard.tsx](frontend/src/pages/admin/Dashboard.tsx)
   - Template: [dashboards/logistics.html](frontend/src/dashboards/logistics.html)
   - Needs: Logistics-focused widgets, charts, and statistics cards

### Customer Pages

5. **Status Tracking** - [frontend/src/pages/user/StatusTracking.tsx](frontend/src/pages/user/StatusTracking.tsx)
   - Template: Could reference [apps/ecommerce/sales/listing.html](frontend/src/apps/ecommerce/sales/listing.html)
   - Needs: DataTables with filters, search, status badges

6. **Item Details** - [frontend/src/pages/user/ItemDetails.tsx](frontend/src/pages/user/ItemDetails.tsx)
   - Template: [apps/ecommerce/sales/details.html](frontend/src/apps/ecommerce/sales/details.html)
   - Needs: Photo gallery, item specifications, tracking timeline

7. **Invoices** - [frontend/src/pages/user/Invoices.tsx](frontend/src/pages/user/Invoices.tsx)
   - Template: [apps/invoices/view/invoice-1.html](frontend/src/apps/invoices/view/invoice-1.html)
   - Needs: Invoice layout with line items, totals, payment info

8. **Support Requests** - [frontend/src/pages/user/Support.tsx](frontend/src/pages/user/Support.tsx)
   - Template: [apps/support-center/tickets/create.html](frontend/src/apps/support-center/tickets/create.html)
   - Needs: Ticket creation form with file uploads

### China Team Pages

9. **Item Receiving** - [frontend/src/pages/china-team/ItemReceiving.tsx](frontend/src/pages/china-team/ItemReceiving.tsx)
   - Template: [apps/ecommerce/catalog/add-product.html](frontend/src/apps/ecommerce/catalog/add-product.html)
   - Needs: Form with image upload, dimension inputs, CBM calculation

10. **Container Management** - [frontend/src/pages/china-team/ContainerManagement.tsx](frontend/src/pages/china-team/ContainerManagement.tsx)
    - Template: [apps/ecommerce/sales/listing.html](frontend/src/apps/ecommerce/sales/listing.html)
    - Needs: Container list with filtering and status updates

### Ghana Team Pages

11. **Item Sorting** - [frontend/src/pages/ghana-team/ItemSorting.tsx](frontend/src/pages/ghana-team/ItemSorting.tsx)
    - Template: [apps/ecommerce/catalog/products.html](frontend/src/apps/ecommerce/catalog/products.html)
    - Needs: Grid/list view with scanning functionality

12. **Delivery Management** - [frontend/src/pages/ghana-team/DeliveryManagement.tsx](frontend/src/pages/ghana-team/DeliveryManagement.tsx)
    - Template: [apps/ecommerce/sales/listing.html](frontend/src/apps/ecommerce/sales/listing.html)
    - Needs: Delivery tracking with customer assignment

### Layout Components

13. **Header** - [frontend/src/components/layout/Header.tsx](frontend/src/components/layout/Header.tsx)
    - Template: Extract from [index.html](frontend/src/index.html) header section
    - Needs: Search, notifications, user menu, theme toggle

14. **Sidebar** - [frontend/src/components/layout/Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx)
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
2. Status Tracking
3. Item Receiving
4. Container Management
5. Dashboard

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

**Next Step**: Update Status Tracking page to match the template layout!
