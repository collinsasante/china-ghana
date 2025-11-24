# AFREQ Quick Reference Guide

## 🎯 System at a Glance

### **User Roles**
- **Customer** → Track shipments, view items, pay invoices, request support
- **China Team** → Receive items, upload photos, package for shipping
- **Ghana Team** → Scan arrivals, sort items, manage pickup/delivery
- **Admin** → Manage all operations, customers, containers, status

---

## 📱 Pages & Features

### Customer Pages (`/`)
| Page | Route | What It Does |
|------|-------|--------------|
| **Dashboard** | `/dashboard` | Overview of shipments |
| **Status** | `/status` | Track all items |
| **Arrival** | `/arrival` | Expected arrival dates |
| **Items** | `/items` | Item details with photos |
| **Announcements** | `/announcements` | Company updates |
| **Invoices** | `/invoices` | Billing & payments |
| **Support** | `/support` | Request help |

### China Team Pages (`/china/*`)
| Page | Route | What It Does |
|------|-------|--------------|
| **Receiving** | `/china/receiving` | Bulk upload photos, create items |
| **Packaging** | `/china/packaging` | Consolidate items, generate carton numbers |

### Ghana Team Pages (`/ghana/*`)
| Page | Route | What It Does |
|------|-------|--------------|
| **Sorting** | `/ghana/sorting` | Scan & verify arrivals |
| **Delivery** | `/ghana/delivery` | Manage pickups |

### Admin Pages (`/admin/*`)
| Page | Route | What It Does |
|------|-------|--------------|
| **Status Management** | `/admin/status-management` | Update shipment statuses |
| **Customers** | `/admin/customers` | Manage customer accounts |
| **Containers** | `/admin/containers` | Manage shipping containers |

---

## 🔄 Quick Workflows

### **China Team: Add New Items**
```
1. Go to /china/receiving
2. Select date + container number
3. Upload photos (drag & drop)
4. Click each photo
5. Fill item form
6. CBM auto-calculates
7. Save → Item created!
```

### **Customer: Track Item**
```
1. Login as customer
2. Go to /status
3. See all items with status
4. Click item → See details & photos
```

### **Ghana Team: Process Arrival**
```
1. Go to /ghana/sorting
2. Scan tracking number
3. Verify item condition
4. Mark as ready/damaged/missing
5. Customer gets notified
```

---

## 💾 Data Storage

### **Airtable Tables**
1. **Users** - Customer & team accounts
2. **Items** - Individual shipment items
3. **Containers** - Shipping containers
4. **Invoices** - Customer bills
5. **SupportRequests** - Help tickets
6. **Announcements** - Company updates

### **Cloudinary Folders**
```
afreq/
  └── 2025-01-15/
      └── CONT-2025-001/
          ├── photo1.jpg
          ├── photo2.jpg
          └── photo3.jpg
```

---

## 🛠️ Service Functions

### **Cloudinary** (`src/services/cloudinary.ts`)
```typescript
// Upload single image
uploadImage(file, folder, onProgress)

// Bulk upload with folder structure
uploadBulkImages(files, date, containerNumber, onProgress)

// Get thumbnail
getThumbnailUrl(publicId, size)

// Get transformed image
getImageUrl(publicId, { width, height, crop, quality })
```

### **Airtable** (`src/services/airtable.ts`)
```typescript
// Users
getUserByEmail(email)
createUser(userData)
updateUser(userId, updates)

// Items
getItemsByCustomerId(customerId)
getItemByTrackingNumber(trackingNumber)
getItemsByContainerNumber(containerNumber)
createItem(itemData)
updateItem(itemId, updates)

// Containers
getAllContainers()
createContainer(containerData)
updateContainer(containerId, updates)

// Invoices
getInvoicesByCustomerId(customerId)
createInvoice(invoiceData)
updateInvoice(invoiceId, updates)

// Support
getSupportRequestsByCustomerId(customerId)
createSupportRequest(requestData)
updateSupportRequest(requestId, updates)

// Announcements
getActiveAnnouncements()
createAnnouncement(announcementData)
```

---

## 🔧 Utilities

### **Calculations** (`src/utils/calculations.ts`)
```typescript
// Calculate CBM from dimensions
calculateCBM(length, width, height, unit)

// Convert weight units
convertWeight(value, from, to)

// Convert dimension units
convertDimension(value, from, to)

// Format currency
formatCedis(amount) // → "GH₵ 100.50"
formatUSD(amount)   // → "$100.50"
```

### **Helpers** (`src/utils/helpers.ts`)
```typescript
// Status helpers
getStatusLabel(status)        // → "In Transit"
getStatusBadgeClass(status)   // → "badge-light-primary"

// Date formatting
formatDate(dateString)        // → "15 Jan 2025"
formatDateTime(dateString)    // → "15 Jan 2025, 14:30"

// Generators
generateTrackingNumber()      // → "AFQ17383721LPTO"
generateInvoiceNumber()       // → "INV-2501-1234"

// Validation
isValidEmail(email)           // → true/false
```

---

## 📊 Item Status Flow

```
┌──────────────────┐
│ china_warehouse  │ ← Item received in China
└────────┬─────────┘
         │
         v
┌──────────────────┐
│   in_transit     │ ← Container shipped
└────────┬─────────┘
         │
         v
┌──────────────────┐
│ arrived_ghana    │ ← Container arrived
└────────┬─────────┘
         │
         v
┌──────────────────┐
│ready_for_pickup  │ ← Item verified & ready
└────────┬─────────┘
         │
         v
┌──────────────────┐
│   picked_up      │ ← Customer collected
│       or         │
│   delivered      │ ← Delivered to customer
└──────────────────┘
```

---

## 🎨 Styling with Keen

### **Common Classes**
```html
<!-- Cards -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Title</h3>
  </div>
  <div class="card-body">Content</div>
</div>

<!-- Buttons -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-danger">Danger</button>

<!-- Badges -->
<span class="badge badge-light-success">Active</span>
<span class="badge badge-light-warning">Pending</span>
<span class="badge badge-light-danger">Error</span>

<!-- Tables -->
<table class="table table-row-bordered">
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>

<!-- Forms -->
<input type="text" class="form-control" placeholder="Enter text" />
<select class="form-select">
  <option>Option 1</option>
</select>
```

---

## 🔐 Environment Variables

```env
# Required for Production
VITE_AIRTABLE_API_KEY=pat...
VITE_AIRTABLE_BASE_ID=app...
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
VITE_CLOUDINARY_API_KEY=...

# Optional (works in demo mode without these)
```

---

## 🚀 Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality

# Git
git status           # Check changes
git add .            # Stage all changes
git commit -m "msg"  # Commit changes
git push             # Push to remote
```

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| **README.md** | Project overview |
| **QUICKSTART.md** | 5-minute setup |
| **WORKFLOW.md** | Complete system flow |
| **ROADMAP.md** | Development plan |
| **AIRTABLE_SETUP.md** | Database setup |
| **CLOUDINARY_SETUP.md** | Image storage setup |
| **INTEGRATION_COMPLETE.md** | Backend integration guide |
| **TROUBLESHOOTING.md** | Fix common issues |
| **CLAUDE.md** | Architecture notes |
| **QUICK_REFERENCE.md** | This file! |

---

## 💡 Development Tips

1. **Start with demo mode** - No setup needed
2. **Use existing HTML templates** - Check `src/` folders for UI patterns
3. **Import types correctly** - Always use `import type { ... } from '../types/index'`
4. **Test with mock data first** - Then connect to Airtable
5. **Use utility functions** - Don't duplicate CBM calculations, etc.

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Module import error | Use `import type { ... }` |
| Styles not loading | Check `index.html` has Keen CSS links |
| Upload fails | Verify Cloudinary preset is "unsigned" |
| User not found | Check user exists in Airtable Users table |
| Demo mode stuck | Clear localStorage, refresh page |

---

## 📞 Support

For detailed help, see:
- **Setup issues** → TROUBLESHOOTING.md
- **How things work** → WORKFLOW.md
- **What to build next** → ROADMAP.md

---

**Happy Building! 🚀**
