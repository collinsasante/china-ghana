# Remaining Tasks Summary

**Date:** November 27, 2025

---

## ✅ Completed Today

1. **Remove priority from support request** - Fixed 422 error
2. **Add cedis to Dashboard prices** - Started implementation

---

## 🔄 In Progress

### Add Cedis Display to All Prices

**Status:** Partially complete - only Dashboard done

**Remaining Files to Update:**
1. `frontend/src/pages/user/ItemsPage.tsx` - My Items page
2. `frontend/src/pages/user/CustomerDashboard.tsx` - Main customer dashboard
3. `frontend/src/pages/ghana-team/TaggingPage.tsx` - Tagging page (untagged items)
4. `frontend/src/pages/ghana-team/SortingPage.tsx` - Sorting page
5. `frontend/src/pages/china-team/PackagingPage.tsx` - Packaging page
6. `frontend/src/pages/china-team/ContainerManagementPage.tsx` - Container management
7. `frontend/src/pages/china-team/DashboardPage.tsx` - China dashboard

**Pattern to Follow:**
```typescript
// Display pattern:
<div>${item.costUSD?.toFixed(2) || '0.00'}</div>
<div className="text-gray-600 fs-8">₵{item.costCedis?.toFixed(2) || '0.00'}</div>
```

---

## ⏳ Pending Critical Tasks

### 1. Fix Customer Dashboard (Not Working)

**Problem:** Dashboard may not be loading or displaying correctly

**Investigation Needed:**
- Check routing configuration in `App.tsx` or router setup
- Verify `/packages` route maps to `MyPackagesPage.tsx`
- Check if `CustomerDashboard.tsx` is being used or if it's duplicate
- Test authentication flow for customer users

**Files to Check:**
- `frontend/src/App.tsx` - Route configuration
- `frontend/src/pages/user/CustomerDashboard.tsx`
- `frontend/src/pages/customer/MyPackagesPage.tsx`

---

### 2. Restrict Container Management to Admin Only

**Requirements:**
- Only admin users can access Container Management page
- Remove from China team sidebar menu
- Add to admin sidebar menu
- Implement role-based access control in route

**Files to Modify:**
- `frontend/src/components/layout/Sidebar.tsx` - Update menu items:
  ```typescript
  // Move from china_team to admin only
  { path: '/containers', label: 'Container Management', icon: 'bi-stack', roles: ['admin'] },
  ```
- `frontend/src/pages/china-team/ContainerManagementPage.tsx` - Add access check
- Consider creating admin-specific directory: `frontend/src/pages/admin/`

---

### 3. Add Container Creation and Management Features

**Requirements:**
1. **Create New Container:**
   - Modal with form for container number, expected arrival date
   - Set status, shipping method
   - Auto-assign photo folder path

2. **Add Items to Existing Container:**
   - Search/filter items without containers
   - Bulk select items
   - Assign to container with single action

**Implementation Plan:**
1. Add "Create Container" button to Container Management page
2. Create modal component: `frontend/src/components/admin/CreateContainerModal.tsx`
3. Update `airtable.ts` with `createContainer()` function
4. Add "Assign to Container" bulk action for unassigned items

---

### 4. Make All Tables Clickable with Editable Details

**Requirements:**
- All data tables should support click-to-edit
- Show modal/drawer with editable form
- Save changes back to Airtable

**Tables to Update:**
1. **Items Tables:**
   - My Items (customer view)
   - Tagging page table
   - Sorting page table
   - Packaging page table
   - Container management item list

2. **Other Tables:**
   - Invoices table
   - Support requests table
   - Announcements table (admin)
   - Customers table (admin)

**Pattern to Implement:**
```typescript
// Add onClick handler to table rows
<tr
  key={item.id}
  onClick={() => handleRowClick(item)}
  className="cursor-pointer hover-bg-light"
>
  {/* columns */}
</tr>

// Modal for editing
{selectedItem && (
  <EditItemModal
    item={selectedItem}
    onSave={handleSave}
    onClose={() => setSelectedItem(null)}
  />
)}
```

---

### 5. Give Ghana Team Access to China Team Dashboard

**Requirements:**
- Ghana team should see China team dashboard
- Update sidebar menu permissions

**Implementation:**
```typescript
// In Sidebar.tsx menuItems:
{
  path: '/china/dashboard',
  label: 'China Dashboard',
  icon: 'bi-speedometer2',
  roles: ['china_team', 'ghana_team', 'admin']  // Add 'ghana_team'
},
```

---

### 6. Add Audit Trail System

**Requirements:**
- Track who performed each action (admin, china_team, ghana_team)
- Show user name for each modification
- Add timestamps for actions

**Database Changes Needed:**
1. Add fields to all major tables:
   - `createdBy` (user ID)
   - `createdByName` (user name for display)
   - `lastModifiedBy` (user ID)
   - `lastModifiedByName` (user name)

2. Update all write operations in `airtable.ts`:
   ```typescript
   // Get current user from auth context
   const { user } = useAuth();

   // Include in all creates/updates
   const recordData = {
     ...itemData,
     createdBy: user.id,
     createdByName: user.name,
     lastModifiedBy: user.id,
     lastModifiedByName: user.name,
   };
   ```

3. Display audit info in:
   - Item detail modals
   - Table columns (optional)
   - History/activity logs

**Airtable Schema Updates:**
For each table (Items, Containers, SupportRequests, etc.):
- Add `Created By` (Link to Users table)
- Add `Created By Name` (Formula or Text field)
- Add `Last Modified By` (Link to Users table)
- Add `Last Modified By Name` (Formula or Text field)

---

## 📋 Implementation Priority

### High Priority (Do First):
1. ✅ Fix customer dashboard
2. ✅ Complete cedis display across all pages
3. ✅ Give Ghana team China dashboard access

### Medium Priority:
4. ✅ Restrict container management to admin
5. ✅ Add container creation features

### Lower Priority (Can be done later):
6. ✅ Make all tables clickable/editable
7. ✅ Add audit trail system

---

## 🔧 Quick Wins

### Easy Tasks (< 30 minutes each):

1. **Ghana Team Dashboard Access:**
   - Single line change in Sidebar.tsx
   - Test with Ghana team login

2. **Admin-Only Container Management:**
   - Move menu item to admin role
   - Add simple access check

3. **Cedis Display Completion:**
   - Repeat pattern across remaining 6-7 files
   - Copy-paste approach with minor adjustments

---

## 📝 Testing Checklist

After completing each task, test:

### Customer Dashboard:
- [ ] Loads without errors
- [ ] Shows correct items for logged-in customer
- [ ] Prices display in both USD and GHS
- [ ] All links and navigation work

### Container Management:
- [ ] Only accessible by admin users
- [ ] Non-admin users redirected or see 403
- [ ] Can create new containers
- [ ] Can add items to existing containers

### Tables Clickable:
- [ ] Click any row opens detail modal
- [ ] Can edit all fields
- [ ] Save persists to Airtable
- [ ] Cancel closes without saving

### Audit Trail:
- [ ] User name shows on created items
- [ ] Last modified by updates correctly
- [ ] Visible in item details
- [ ] Works across all user roles

---

## 🚨 Known Issues to Address

1. **Customer Dashboard Not Working** - Root cause unknown, needs investigation
2. **Cedis Display Incomplete** - Only Dashboard done, 7 more pages need updates
3. **No Role-Based Access Control** - All team members can access all pages
4. **No Audit Trail** - Can't track who made what changes

---

## 💡 Recommendations

### For Quick Deployment:
1. Complete cedis display (2-3 hours)
2. Fix customer dashboard (30 min - 2 hours depending on issue)
3. Add Ghana team China dashboard access (5 minutes)
4. Deploy and test

### For Full Feature Set:
Complete all remaining tasks in priority order over 2-3 development sessions.

---

**Next Steps:** Start with high-priority tasks, test thoroughly, commit frequently with descriptive messages.
