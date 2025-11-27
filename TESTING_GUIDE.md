# AFREQ System Testing Guide

## ✅ System Status

**Dev Server:** Running at http://localhost:5173/

---

## 📋 Pre-Test Setup

### 1. Airtable Configuration

Follow [AIRTABLE_SETUP.md](./AIRTABLE_SETUP.md) to create your tables:

**Required Tables:**
- ✅ Users
- ✅ Items (with `customerId_old` field - **exact name required!**)
- ⚠️ Containers (optional)
- ⚠️ Invoices (optional)
- ⚠️ SupportRequests (optional)
- ⚠️ Announcements (optional)

**Critical Field Names:**
- Items table: `customerId_old` (NOT `customerId`)
- All other tables: `customerId` (standard name)

### 2. Environment Variables

Create `.env` file in `/frontend/` directory:

```env
# Airtable
VITE_AIRTABLE_API_KEY=your_api_key_here
VITE_AIRTABLE_BASE_ID=your_base_id_here

# Cloudinary (for image uploads)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 3. Test Data

Create at least:
- **2-3 Users** (role: customer)
- **5-10 Items** with different statuses:
  - 2 items: `status = china_warehouse`, `customerId_old = empty`, `cartonNumber = empty`
  - 2 items: `status = china_warehouse`, `customerId_old = [some customer]`, `cartonNumber = empty`
  - 2 items: `status = china_warehouse`, `customerId_old = [some customer]`, `cartonNumber = CART-001`
  - 2 items: `status = in_transit`, `containerNumber = CONT-001`
  - 2 items: `status = arrived_ghana`

---

## 🧪 Testing Workflow

### **Workflow 1: China Team - Item Receiving**

**Page:** Receiving Page
**URL:** `/china-team/receiving`

**Test Steps:**
1. ✅ Select receiving date (defaults to today)
2. ✅ Click "Select images to upload" button
3. ✅ Choose multiple images (3-5 images)
4. ✅ Images should upload automatically to Cloudinary
5. ✅ Progress bars should show upload progress
6. ✅ After upload, click each image to add item details:
   - Tracking number (e.g., TRACK001)
   - Item name
   - Dimensions (L × W × H)
   - Dimension unit (inches/cm)
   - Shipping method (sea/air)
   - Weight (if air shipping)
   - Cost USD (auto-calculated)
7. ✅ Submit each item form
8. ✅ Green checkmark should appear on completed items

**Expected Results:**
- ✅ Single upload button (not two buttons)
- ✅ Auto upload on file selection
- ✅ Progress tracking
- ✅ Items saved to Airtable
- ✅ Images visible in item cards

---

### **Workflow 2: China Team - Dashboard**

**Page:** China Team Dashboard
**URL:** `/china-team/dashboard`

**Test Steps:**
1. ✅ View overview statistics:
   - Total items
   - Ready to package count
   - Total CBM
   - Total value
2. ✅ Check status breakdown (6 cards)
3. ✅ Review recent items table
4. ✅ Check shipping methods breakdown
5. ✅ View items received chart
6. ✅ Click "Refresh" button

**Expected Results:**
- ✅ All stats display correctly
- ✅ Numbers match Airtable data
- ✅ Charts render properly
- ✅ Refresh updates data

---

### **Workflow 3: China Team - Packaging**

**Page:** Packaging Page
**URL:** `/china-team/packaging`

**Test Steps:**
1. ✅ Select a customer from dropdown
2. ✅ View items assigned to that customer
3. ✅ Check "Ready to Package" count
4. ✅ Enter carton number (e.g., CART-001)
5. ✅ Select items with checkboxes
6. ✅ Click "Package Selected Items"
7. ✅ Verify items move to "Packaged Items" section
8. ✅ Switch to "All Items" tab
9. ✅ Search for items by tracking number
10. ✅ Expand/collapse date folders

**Expected Results:**
- ✅ Customer filtering works
- ✅ Items display with photos
- ✅ Carton assignment successful
- ✅ Packaged items separated
- ✅ Search filters correctly
- ✅ Folder collapsing works

---

### **Workflow 4: China Team - Container Management**

**Page:** Container Management
**URL:** `/china-team/containers`

**Test Steps:**
1. ✅ View statistics (containers, items loaded, available)
2. ✅ Check "Available to Load" section
3. ✅ Select items with checkboxes (items with carton numbers)
4. ✅ Click "Load X Items" button
5. ✅ Enter container number (e.g., CONT-2024-001)
6. ✅ Review loading summary (CBM, value)
7. ✅ Click "Load Container"
8. ✅ Verify items appear in "Loaded Containers" section
9. ✅ Expand container to view items
10. ✅ Check item status auto-updated to "in_transit"
11. ✅ Test "Remove" button (for in_transit items)

**Expected Results:**
- ✅ Only packaged items show in available list
- ✅ Container assignment successful
- ✅ Status auto-updates to in_transit
- ✅ Container stats calculate correctly
- ✅ Accordion expansion works
- ✅ Remove functionality works

---

### **Workflow 5: Ghana Team - Tagging Portal**

**Page:** Tagging Page
**URL:** `/ghana-team/tagging`

**Test Steps:**
1. ✅ View "Needs Tagging" count (unassigned items)
2. ✅ Check untagged items grid
3. ✅ Click "Assign to Customer" on an item
4. ✅ Select customer from dropdown
5. ✅ Click "Assign Customer"
6. ✅ Verify item moves to "Tagged Items" table
7. ✅ Search for items
8. ✅ Click "Unassign" on a tagged item
9. ✅ Verify item returns to untagged section

**Expected Results:**
- ✅ Untagged items display in cards
- ✅ Customer assignment works
- ✅ Items move between sections
- ✅ Search functionality works
- ✅ Unassign functionality works
- ✅ Photos display correctly

---

### **Workflow 6: Ghana Team - Sorting & Scanning**

**Page:** Sorting Page
**URL:** `/ghana-team/sorting`

**Test Steps:**
1. ✅ View item statistics
2. ✅ Search for items by tracking number
3. ✅ Filter by status
4. ✅ Select multiple items with checkboxes
5. ✅ Use bulk actions:
   - Mark as In Transit
   - Mark as Arrived Ghana
   - Mark as Ready for Pickup
   - Mark as Delivered
6. ✅ Mark individual items as damaged
7. ✅ Mark individual items as missing
8. ✅ Check counts update

**Expected Results:**
- ✅ Filtering works correctly
- ✅ Bulk status updates succeed
- ✅ Individual item flagging works
- ✅ Stats update in real-time
- ✅ Images display properly

---

### **Workflow 7: Ghana Team - CSV Import**

**Page:** CSV Import
**URL:** `/ghana-team/csv-import`

**Test Steps:**
1. ✅ Click "Download Template"
2. ✅ Open CSV file and add test data:
   ```csv
   tracking_number,status,container_number
   TRACK001,in_transit,CONT-2024-001
   TRACK002,arrived_ghana,CONT-2024-001
   TRACK003,ready_for_pickup,
   ```
3. ✅ Upload CSV file
4. ✅ Review data preview
5. ✅ Click "Import X Updates"
6. ✅ Check import results (success/failure)
7. ✅ Verify items updated in Airtable
8. ✅ Click "Import Another File"

**Expected Results:**
- ✅ Template downloads correctly
- ✅ CSV parsing works
- ✅ Preview shows data
- ✅ Import processes all rows
- ✅ Success/failure messages accurate
- ✅ Airtable records updated
- ✅ Invalid tracking numbers handled

---

### **Workflow 8: Customer - My Packages**

**Page:** My Packages (Customer Portal)
**URL:** `/customer/packages`

**Test Steps:**
1. ✅ View package statistics
2. ✅ Check shipping timeline visual
3. ✅ Search for packages
4. ✅ Filter by status
5. ✅ Click "View Details" on a package
6. ✅ Review package details modal:
   - Photos
   - Tracking info
   - Dimensions & CBM
   - Cost (USD & GHS)
   - Status
7. ✅ Close modal

**Expected Results:**
- ✅ Only customer's packages shown
- ✅ Timeline highlights active stages
- ✅ Filtering works
- ✅ Package cards display correctly
- ✅ Details modal shows all info
- ✅ Photos display properly
- ✅ Costs formatted correctly

---

## 🔍 Common Issues & Solutions

### Issue: "customerId not found" or 0 items
**Solution:**
- Check Items table has field named exactly `customerId_old` (not `customerId`)
- Verify it's a "Link to another record" type
- Ensure customer is linked properly

### Issue: Images not displaying
**Solution:**
- Check Cloudinary credentials in `.env`
- Verify photos field is "Attachment" type in Airtable
- Code handles both string URLs and Airtable attachment objects

### Issue: "Cannot read properties of undefined (reading 'toUpperCase')"
**Solution:**
- Some items missing `shippingMethod` field
- Code has null checks - update Airtable data

### Issue: CBM not calculating
**Solution:**
- Ensure `length`, `width`, `height` are Number type
- Check `cbm` field exists (can be Number or Formula)
- Formula: `IF({dimensionUnit}='cm', ({length}*{width}*{height})/1000000, ({length}*{width}*{height})/61024)`

### Issue: Packaging page shows 0 items
**Solution:**
- Items must have:
  - `customerId_old` field linked to a customer
  - `status = china_warehouse`
  - `cartonNumber` empty (for "Ready to Package")

### Issue: Container page shows no available items
**Solution:**
- Items must have:
  - `cartonNumber` filled
  - `containerNumber` empty
  - `status = china_warehouse`

---

## 📊 Test Scenarios

### Scenario A: New Shipment Workflow
1. China Team receives items (Receiving Page)
2. Ghana Team tags items to customers (Tagging Page)
3. China Team packages items (Packaging Page)
4. China Team loads into container (Container Management)
5. Ghana Team imports CSV update (CSV Import)
6. Customer views packages (Customer Portal)

### Scenario B: Damaged Item Workflow
1. Ghana Team marks item as damaged (Sorting Page)
2. Customer sees damaged flag (Customer Portal)
3. Support team investigates

### Scenario C: Bulk Status Update
1. Container arrives in Ghana
2. Ghana Team creates CSV with all tracking numbers
3. Upload CSV with status = `arrived_ghana`
4. All items updated automatically

---

## ✅ Testing Checklist

### Core Functionality
- [ ] Item creation with photos
- [ ] Customer assignment
- [ ] Packaging workflow
- [ ] Container loading
- [ ] Status updates
- [ ] CSV import
- [ ] Customer portal viewing

### Data Integrity
- [ ] Items save to Airtable
- [ ] Linked records work (customerId_old)
- [ ] Status transitions correctly
- [ ] Photos upload and display
- [ ] CBM calculations accurate
- [ ] Costs calculate correctly

### UI/UX
- [ ] All pages load without errors
- [ ] Images display properly
- [ ] Buttons respond correctly
- [ ] Modals open/close
- [ ] Search filters work
- [ ] Loading states show
- [ ] Error messages clear

### Edge Cases
- [ ] Empty data states
- [ ] Null/undefined fields
- [ ] Missing photos
- [ ] Invalid CSV data
- [ ] Duplicate tracking numbers
- [ ] Missing customer links

---

## 🎯 Success Criteria

Your system is ready when:
- ✅ All 8 workflows complete without errors
- ✅ Data syncs correctly with Airtable
- ✅ Images upload and display
- ✅ All pages render properly
- ✅ Search and filters work
- ✅ CSV import processes successfully
- ✅ Customer portal shows correct data

---

## 🚀 Next Steps

After successful testing:
1. Add authentication system
2. Implement role-based access control
3. Add email notifications
4. Create invoice generation
5. Build reporting dashboards
6. Add support ticket system
7. Implement announcement system

---

## 📞 Need Help?

Check console logs:
```javascript
// Open browser DevTools (F12)
// Go to Console tab
// Look for error messages
```

Check network requests:
```javascript
// Go to Network tab
// Look for failed API calls
// Check request/response details
```

Happy Testing! 🎉
