# Airtable Setup for Settings & Warehouses

This guide shows you how to set up the necessary Airtable tables to support the new Settings and Warehouse management features.

## Overview

The system now includes:
1. **Warehouses Table** - Manage origin and destination warehouse locations
2. **Settings Table** - Store exchange rates and shipping costs
3. **Enhanced Users Table** - Support for temporary passwords for email automation

## Required Airtable Tables

### 1. Settings Table

**Table Name:** `Settings`

This table stores system-wide configuration including exchange rates and shipping costs.

#### Fields to Create:

| Field Name | Field Type | Description | Default Value |
|------------|-----------|-------------|---------------|
| `id` | Single line text | Unique identifier | "default" |
| `usdToGhsRate` | Number | USD to Ghana Cedis exchange rate | 15.0 |
| `usdToCnyRate` | Number | USD to Chinese Yuan exchange rate | 7.2 |
| `seaShippingRatePerCBM` | Number | Sea freight cost per cubic meter (USD) | 1000 |
| `airShippingRatePerKg` | Number | Air freight cost per kilogram (USD) | 5 |
| `updatedAt` | Date | Last update timestamp | Auto (now) |
| `updatedBy` | Single line text | User ID who last updated | - |

**Setup Steps:**

1. In your Airtable base, click **"Add or import table"**
2. Select **"Create empty table"**
3. Name it: **Settings**
4. Click on each column header and configure the fields as shown above
5. Add one record with the default values:
   - id: `default`
   - usdToGhsRate: `15`
   - usdToCnyRate: `7.2`
   - seaShippingRatePerCBM: `1000`
   - airShippingRatePerKg: `5`
   - updatedAt: (leave as auto-generated)

**Number Field Configuration:**
- Precision: 2 decimal places for rates
- Format: Number (not percentage or currency)

---

### 2. Warehouses Table

**Table Name:** `Warehouses`

This table stores all warehouse locations (origin and destination points).

#### Fields to Create:

| Field Name | Field Type | Description |
|------------|-----------|-------------|
| `id` | Auto number (or Formula) | Unique identifier |
| `name` | Single line text | Warehouse name |
| `country` | Single line text | Country location |
| `city` | Single line text | City location |
| `address` | Long text | Full address (optional) |
| `isActive` | Checkbox | Whether warehouse is active |
| `isOrigin` | Checkbox | Can ship items FROM this location |
| `isDestination` | Checkbox | Can receive items AT this location |
| `createdAt` | Created time | Auto-generated timestamp |
| `updatedAt` | Last modified time | Auto-generated timestamp |

**Setup Steps:**

1. Create the **Warehouses** table
2. Add all fields as specified above
3. Add default warehouse records:

**Default Record 1 - China Warehouse:**
- name: `China Main Warehouse`
- country: `China`
- city: `Guangzhou`
- address: (optional)
- isActive: ✓ (checked)
- isOrigin: ✓ (checked)
- isDestination: ☐ (unchecked)

**Default Record 2 - Ghana Warehouse:**
- name: `Ghana Main Warehouse`
- country: `Ghana`
- city: `Accra`
- address: (optional)
- isActive: ✓ (checked)
- isOrigin: ☐ (unchecked)
- isDestination: ✓ (checked)

**ID Field Options:**

You can use either:
- **Auto number** - Airtable generates sequential numbers
- **Formula** - Use: `"wh-" & RECORD_ID()` for IDs like "wh-rec123..."

---

### 3. Users Table Enhancement

**Table Name:** `Users` (already exists)

Add one new field to support email automation:

| Field Name | Field Type | Description | Note |
|------------|-----------|-------------|------|
| `tempPassword` | Single line text | Temporary plain-text password for email | Auto-cleared by automation |

**Setup Steps:**

1. Open your existing **Users** table
2. Add a new field: **tempPassword**
3. Type: **Single line text**
4. Description: "Temporary password for email automation (auto-cleared after email sent)"

**Important:** This field is used by Airtable automation to send the password to customers via email. The automation will automatically clear this field after sending the email for security.

---

## Integration with Frontend

### Option 1: Use Airtable (Recommended)

Update the Airtable service to read/write settings:

**Create new functions in `frontend/src/services/airtable.ts`:**

```typescript
// Settings Operations
export async function getSystemSettings(): Promise<SystemSettings | null> {
  try {
    const records = await base('Settings')
      .select({
        filterByFormula: `{id} = 'default'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) return null;
    return recordToObject(records[0]) as SystemSettings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  try {
    // Find the default settings record
    const records = await base('Settings')
      .select({
        filterByFormula: `{id} = 'default'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      throw new Error('Settings record not found');
    }

    const record = await base('Settings').update([
      {
        id: records[0].id,
        fields: {
          ...settings,
          updatedAt: new Date().toISOString(),
        },
      },
    ]);

    return recordToObject(record[0]) as SystemSettings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

// Warehouse Operations
export async function getAllWarehouses(): Promise<Warehouse[]> {
  try {
    const records = await base('Warehouses')
      .select({
        sort: [{ field: 'name', direction: 'asc' }],
      })
      .all();

    return records.map((record) => recordToObject(record) as Warehouse);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
}

export async function getActiveWarehouses(type?: 'origin' | 'destination'): Promise<Warehouse[]> {
  try {
    let formula = '{isActive} = TRUE()';

    if (type === 'origin') {
      formula = 'AND({isActive} = TRUE(), {isOrigin} = TRUE())';
    } else if (type === 'destination') {
      formula = 'AND({isActive} = TRUE(), {isDestination} = TRUE())';
    }

    const records = await base('Warehouses')
      .select({
        filterByFormula: formula,
        sort: [{ field: 'name', direction: 'asc' }],
      })
      .all();

    return records.map((record) => recordToObject(record) as Warehouse);
  } catch (error) {
    console.error('Error fetching active warehouses:', error);
    throw error;
  }
}

export async function createWarehouse(warehouseData: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Promise<Warehouse> {
  try {
    const record = await base('Warehouses').create([{
      fields: warehouseData
    }]);
    return recordToObject(record[0]) as Warehouse;
  } catch (error) {
    console.error('Error creating warehouse:', error);
    throw error;
  }
}

export async function updateWarehouse(warehouseId: string, updates: Partial<Warehouse>): Promise<Warehouse> {
  try {
    const record = await base('Warehouses').update([
      {
        id: warehouseId,
        fields: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
    ]);
    return recordToObject(record[0]) as Warehouse;
  } catch (error) {
    console.error('Error updating warehouse:', error);
    throw error;
  }
}

export async function deleteWarehouse(warehouseId: string): Promise<void> {
  try {
    await base('Warehouses').destroy([warehouseId]);
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    throw error;
  }
}
```

### Option 2: Use localStorage (Current Implementation)

The current Settings page already uses localStorage. This works for single-user scenarios but won't sync across devices or users.

**Advantages of localStorage:**
- ✓ No Airtable setup needed
- ✓ Works immediately
- ✓ Fast access
- ✗ Not shared across users
- ✗ Lost if browser data is cleared

**Advantages of Airtable:**
- ✓ Shared across all users
- ✓ Persistent and backed up
- ✓ Can be edited directly in Airtable
- ✓ Audit trail with timestamps
- ✗ Requires API calls
- ✗ Slightly slower

---

## Update Settings Page to Use Airtable

Once you've created the Airtable tables, update `SettingsPage.tsx`:

**Replace the loadData function:**

```typescript
import {
  getSystemSettings,
  updateSystemSettings,
  getAllWarehouses,
  createWarehouse as createWarehouseInAirtable,
  updateWarehouse as updateWarehouseInAirtable,
  deleteWarehouse as deleteWarehouseFromAirtable
} from '../../services/airtable';

const loadData = async () => {
  setLoading(true);
  try {
    // Load settings from Airtable
    const settingsData = await getSystemSettings();
    if (settingsData) {
      setSettings(settingsData);
    }

    // Load warehouses from Airtable
    const warehousesData = await getAllWarehouses();
    setWarehouses(warehousesData);
  } catch (error) {
    console.error('Failed to load settings:', error);
    showNotification('error', 'Error', 'Failed to load settings from Airtable');
  } finally {
    setLoading(false);
  }
};

const handleSaveSettings = async () => {
  try {
    const updatedSettings = await updateSystemSettings({
      usdToGhsRate: settings.usdToGhsRate,
      usdToCnyRate: settings.usdToCnyRate,
      seaShippingRatePerCBM: settings.seaShippingRatePerCBM,
      airShippingRatePerKg: settings.airShippingRatePerKg,
    });

    setSettings(updatedSettings);
    showNotification('success', 'Settings Saved!', 'System settings have been updated in Airtable');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showNotification('error', 'Save Failed', 'Failed to save settings to Airtable');
  }
};

const handleAddWarehouse = async () => {
  // ... validation code ...

  try {
    const warehouse = await createWarehouseInAirtable({
      ...newWarehouse,
      isActive: true,
    });

    setWarehouses(prev => [...prev, warehouse]);
    setNewWarehouse({ name: '', country: '', city: '', address: '', isOrigin: false, isDestination: false });
    setShowAddWarehouseModal(false);
    showNotification('success', 'Warehouse Added!', `${warehouse.name} has been added to Airtable`);
  } catch (error) {
    console.error('Failed to add warehouse:', error);
    showNotification('error', 'Failed', 'Could not add warehouse to Airtable');
  }
};
```

---

## Update Table Names in airtable.ts

Add the new table names to the `TABLES` constant:

```typescript
export const TABLES = {
  USERS: 'Users',
  ITEMS: 'Items',
  CONTAINERS: 'Containers',
  INVOICES: 'Invoices',
  SUPPORT_REQUESTS: 'SupportRequests',
  ANNOUNCEMENTS: 'Announcements',
  SETTINGS: 'Settings',          // NEW
  WAREHOUSES: 'Warehouses',      // NEW
} as const;
```

---

## Testing Your Setup

### 1. Test Settings

1. Go to **Admin → Settings** in the app
2. Update exchange rates and shipping costs
3. Click **"Save Settings"**
4. Refresh the page and verify values persist
5. Check Airtable to see the updated record

### 2. Test Warehouses

1. Click **"Add Warehouse"**
2. Enter warehouse details
3. Select Origin/Destination types
4. Click **"Add Warehouse"**
5. Verify it appears in the table
6. Check Airtable to see the new record

### 3. Test Email Automation (if configured)

1. Create a test customer account
2. Check that `tempPassword` field is populated
3. Verify email is sent (if automation is set up)
4. Confirm `tempPassword` is cleared after email sent

---

## Migration Path

If you're currently using localStorage and want to migrate to Airtable:

**Step 1:** Export current settings from browser:
```javascript
// Run in browser console
const settings = localStorage.getItem('afreq_settings');
const warehouses = localStorage.getItem('afreq_warehouses');
console.log(JSON.parse(settings));
console.log(JSON.parse(warehouses));
```

**Step 2:** Manually add these values to Airtable

**Step 3:** Update SettingsPage.tsx to use Airtable functions

**Step 4:** Test thoroughly before removing localStorage fallback

---

## Airtable Permissions

Make sure your Airtable API key has these permissions:
- ✓ Read access to Settings table
- ✓ Write access to Settings table
- ✓ Read access to Warehouses table
- ✓ Write access to Warehouses table
- ✓ Delete access to Warehouses table (for removing warehouses)

---

## Troubleshooting

**Settings not loading:**
- Verify `Settings` table exists in Airtable
- Check that there's a record with `id = "default"`
- Confirm API key has read permissions

**Settings not saving:**
- Check API key has write permissions
- Verify field names match exactly (case-sensitive)
- Check browser console for error messages

**Warehouses not appearing:**
- Verify `Warehouses` table exists
- Check `isActive` checkbox is enabled
- Confirm records exist in Airtable

**Email automation not working:**
- Verify `tempPassword` field exists in Users table
- Check automation is turned ON in Airtable
- Verify trigger conditions match (role=customer, isFirstLogin=true)
- Check automation run history for errors

---

## Next Steps

1. **Create Airtable Tables** - Follow the setup steps above
2. **Add Sample Data** - Create default warehouses and settings
3. **Update airtable.ts** - Add the new service functions
4. **Update SettingsPage.tsx** - Connect to Airtable instead of localStorage
5. **Test Thoroughly** - Verify all CRUD operations work
6. **Update ItemDetailsModal** - Use settings from Airtable for rate calculations

---

## Summary

After completing this setup, you'll have:
- ✓ Centralized exchange rate management
- ✓ Configurable shipping costs
- ✓ Flexible warehouse locations
- ✓ Multi-user support (if using Airtable)
- ✓ Easy updates without code changes
- ✓ Audit trail with timestamps

All settings can be managed from the admin Settings page (`/admin/settings`) with changes reflected immediately throughout the system.
