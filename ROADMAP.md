# AFREQ Development Roadmap

## Phase 1: Foundation ✅ COMPLETED

- [x] Project setup with Vite + React + TypeScript
- [x] Install dependencies (React Router, Bootstrap, Popper.js)
- [x] Configure template assets
- [x] Create type definitions
- [x] Build authentication system
- [x] Create layout components (Header, Sidebar, MainLayout)
- [x] Set up routing with protected routes
- [x] Create utility functions (CBM calculation, formatters)
- [x] Create placeholder pages for all modules

## Phase 2: Customer Portal (User Side) 🎯 NEXT

### 2.1 Shipment Status Page
**File:** `src/pages/user/StatusPage.tsx`

**Features:**
- [ ] Data table with shipment items
- [ ] Status badges (color-coded by status)
- [ ] Search by tracking number
- [ ] Filter by status (dropdown)
- [ ] Sort by date, status, tracking number
- [ ] Show: Item name, Tracking #, Status, Last updated

**Components to create:**
- [ ] `src/components/user/StatusTable.tsx`
- [ ] `src/components/user/StatusBadge.tsx`
- [ ] `src/components/common/SearchBar.tsx`

**Data needed:**
- Mock data array of items with statuses
- Later: API endpoint `/api/user/items`

---

### 2.2 Estimated Arrival Page
**File:** `src/pages/user/EstimatedArrivalPage.tsx`

**Features:**
- [ ] Timeline/calendar view of arrivals
- [ ] Group by container
- [ ] Show expected date vs actual date
- [ ] Count of items per container

**Components to create:**
- [ ] `src/components/user/ArrivalTimeline.tsx`
- [ ] `src/components/user/ContainerCard.tsx`

---

### 2.3 Items Detail Page
**File:** `src/pages/user/ItemsPage.tsx`

**Features:**
- [ ] Grid view of items with photos
- [ ] Click item → Modal with full details
- [ ] Show: Photos (gallery), Dimensions, CBM, Weight, Cost
- [ ] Lightbox for photo viewing
- [ ] Download invoice button

**Components to create:**
- [ ] `src/components/user/ItemGrid.tsx`
- [ ] `src/components/user/ItemDetailModal.tsx`
- [ ] `src/components/common/PhotoGallery.tsx`

**Assets:**
- Use the lightbox: `/src/assets/plugins/custom/fslightbox/fslightbox.bundle.js`

---

### 2.4 Announcements Page
**File:** `src/pages/user/AnnouncementsPage.tsx`

**Features:**
- [ ] List of announcements (card view)
- [ ] Show title, date, content
- [ ] Sort by newest first
- [ ] Read/unread indicator

**Components to create:**
- [ ] `src/components/user/AnnouncementCard.tsx`

---

### 2.5 Invoices Page
**File:** `src/pages/user/InvoicesPage.tsx`

**Features:**
- [ ] Invoice list table
- [ ] Status badges (Paid, Pending, Overdue)
- [ ] Click → View invoice detail
- [ ] Download/Print invoice
- [ ] Show: Invoice #, Date, Amount, Status

**Components to create:**
- [ ] `src/components/user/InvoiceTable.tsx`
- [ ] `src/components/user/InvoiceDetail.tsx`

---

### 2.6 Support Request Page
**File:** `src/pages/user/SupportPage.tsx`

**Features:**
- [ ] Support request form
- [ ] Type selector (Missing Item, Wrong Delivery, General)
- [ ] Tracking number selector (dropdown from user's items)
- [ ] Description textarea
- [ ] Submit → Send email to support team
- [ ] View past support requests

**Components to create:**
- [ ] `src/components/user/SupportForm.tsx`
- [ ] `src/components/user/SupportRequestList.tsx`

**Integration:**
- Email service API endpoint

---

## Phase 3: China Team Module 📦

### 3.1 Bulk Image Upload
**File:** `src/pages/china-team/ReceivingPage.tsx`

**Features:**
- [ ] Folder organization UI (Date picker + Container number input)
- [ ] Multi-file upload (drag & drop)
- [ ] Image preview grid
- [ ] Progress bar during upload
- [ ] Click image → Open item form modal

**Components to create:**
- [ ] `src/components/china-team/BulkUpload.tsx`
- [ ] `src/components/china-team/ImageGrid.tsx`
- [ ] `src/components/common/FileUpload.tsx`

**New types:**
- [ ] Add upload progress type
- [ ] Add file metadata type

---

### 3.2 Item Receiving Form
**File:** `src/components/china-team/ItemForm.tsx`

**Features:**
- [ ] Modal form
- [ ] Fields: Item name, Tracking #, Dimensions (L×W×H)
- [ ] Unit selector (inches/cm)
- [ ] Auto-calculate CBM on dimension change
- [ ] Weight input with unit selector
- [ ] USD price → Auto convert to Cedis
- [ ] Associate with uploaded photo
- [ ] Save button

**Utilities:**
- Already have: `calculateCBM()` in `src/utils/calculations.ts`
- Need: Currency conversion rate (USD to GHS)

---

### 3.3 Packaging Module
**File:** `src/pages/china-team/PackagingPage.tsx`

**Features:**
- [ ] Customer selector
- [ ] List of received items
- [ ] Select multiple items to package together
- [ ] Generate carton number
- [ ] Print carton label
- [ ] Update status → "Packaged"

**Components to create:**
- [ ] `src/components/china-team/PackagingInterface.tsx`
- [ ] `src/components/china-team/CustomerSelector.tsx`
- [ ] `src/components/common/ItemSelector.tsx`

---

## Phase 4: Ghana Team Module 🇬🇭

### 4.1 Sorting & Scanning
**File:** `src/pages/ghana-team/SortingPage.tsx`

**Features:**
- [ ] Barcode/QR code scanner input
- [ ] Manual tracking number entry
- [ ] Item info display on scan
- [ ] Assign to customer (if not assigned)
- [ ] Mark as "Arrived Ghana"
- [ ] Flag damaged/missing items
- [ ] Batch scan mode

**Components to create:**
- [ ] `src/components/ghana-team/Scanner.tsx`
- [ ] `src/components/ghana-team/ItemAssignment.tsx`
- [ ] `src/components/ghana-team/DamageReport.tsx`

**Libraries needed:**
- [ ] Install barcode scanner library (e.g., `html5-qrcode`)

---

### 4.2 Delivery Management
**File:** `src/pages/ghana-team/DeliveryPage.tsx`

**Features:**
- [ ] List of items ready for pickup
- [ ] Filter by customer
- [ ] Mark as "Picked up" or "Delivered"
- [ ] Add delivery notes
- [ ] Signature capture
- [ ] Print pickup receipt

**Components to create:**
- [ ] `src/components/ghana-team/DeliveryTable.tsx`
- [ ] `src/components/ghana-team/SignatureCapture.tsx`

---

## Phase 5: Admin Module 👨‍💼

### 5.1 Status Management Dashboard
**File:** `src/pages/admin/StatusManagementPage.tsx`

**Features:**
- [ ] Overview of all shipments
- [ ] Bulk status update
- [ ] Container status tracking
- [ ] Update shipment stages
- [ ] Analytics widgets (items by status, containers in transit)

**Components to create:**
- [ ] `src/components/admin/StatusOverview.tsx`
- [ ] `src/components/admin/BulkStatusUpdate.tsx`

---

### 5.2 Customer Management
**File:** `src/pages/admin/CustomersPage.tsx`

**Features:**
- [ ] Customer list table
- [ ] Add/Edit/Delete customers
- [ ] View customer's items
- [ ] Customer details (contact, address, payment status)

**Components to create:**
- [ ] `src/components/admin/CustomerTable.tsx`
- [ ] `src/components/admin/CustomerForm.tsx`

---

### 5.3 Container Management
**File:** `src/pages/admin/ContainersPage.tsx`

**Features:**
- [ ] Container list
- [ ] Add new container
- [ ] Update container status
- [ ] View items in container
- [ ] Expected vs actual arrival dates

**Components to create:**
- [ ] `src/components/admin/ContainerTable.tsx`
- [ ] `src/components/admin/ContainerForm.tsx`

---

### 5.4 Analytics & Reporting
**File:** `src/pages/admin/AnalyticsPage.tsx`

**Features:**
- [ ] Dashboard widgets
- [ ] Items by status chart
- [ ] Revenue charts
- [ ] Container timeline
- [ ] Export reports (CSV, PDF)

**Libraries needed:**
- [ ] Install Chart.js or similar

---

## Phase 6: Backend Integration 🔌

### 6.1 API Setup
- [ ] Define API endpoints
- [ ] Set up Axios or Fetch wrapper
- [ ] Create API service layer (`src/services/api.ts`)
- [ ] Add loading states
- [ ] Error handling

### 6.2 Authentication API
- [ ] Replace mock login with real API
- [ ] JWT token management
- [ ] Refresh token logic
- [ ] Logout API

### 6.3 Data Endpoints
- [ ] User items endpoint
- [ ] Upload images endpoint
- [ ] CRUD operations for all entities
- [ ] Support email endpoint

---

## Phase 7: Advanced Features 🚀

### 7.1 Real-time Updates
- [ ] WebSocket connection
- [ ] Live status updates
- [ ] Notifications

### 7.2 Notifications
- [ ] Email notifications
- [ ] SMS notifications (optional)
- [ ] In-app notifications

### 7.3 Reporting
- [ ] Generate PDF invoices
- [ ] Export data to Excel
- [ ] Print shipping labels

### 7.4 Mobile Responsiveness
- [ ] Test on mobile devices
- [ ] Adjust layouts for small screens
- [ ] Touch-friendly scanning interface

---

## Implementation Tips

### Start Small
Begin with one feature at a time. For example:
1. Build StatusPage with mock data
2. Test it thoroughly
3. Move to next feature

### Use Templates
Reference HTML templates in `src/` folders:
- Tables: `src/apps/customers/list.html`
- Forms: `src/utilities/modals/forms/`
- Cards: `src/dashboards/`

### Mock Data First
Create mock data files before API integration:
- `src/data/mockItems.ts`
- `src/data/mockInvoices.ts`
- etc.

### Component Reusability
Build generic components:
- `<DataTable>` for all tables
- `<Modal>` for all modals
- `<StatusBadge>` reused everywhere

---

## Priority Order Recommendation

1. **Phase 2.1** - Status Page (most important for customers)
2. **Phase 2.3** - Items Detail (customers need to see their items)
3. **Phase 3.1 + 3.2** - Bulk Upload + Item Form (China team's main workflow)
4. **Phase 4.1** - Sorting & Scanning (Ghana team's main workflow)
5. **Phase 2.5** - Invoices (business critical)
6. Rest of features in order

---

**Next Immediate Step:** Build the Status Page with mock data! 🎯
