import Airtable from 'airtable';
import { config } from '../config/env';
import type {
  User,
  Item,
  Container,
  Invoice,
  SupportRequest,
  Announcement,
} from '../types/index';

// Initialize Airtable
const base = new Airtable({ apiKey: config.airtable.apiKey }).base(config.airtable.baseId);

/**
 * Table Names in Airtable
 * These should match your Airtable base structure
 */
export const TABLES = {
  USERS: 'Users',
  ITEMS: 'Items',
  CONTAINERS: 'Containers',
  INVOICES: 'Invoices',
  SUPPORT_REQUESTS: 'SupportRequests',
  ANNOUNCEMENTS: 'Announcements',
} as const;

/**
 * Generic Airtable record type
 */
interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

/**
 * Convert Airtable record to our app format
 */
function recordToObject<T>(record: AirtableRecord<T>): T & { id: string } {
  return {
    id: record.id,
    ...record.fields,
  };
}

// ============================================
// USER OPERATIONS
// ============================================

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const records = await base(TABLES.USERS)
      .select({
        filterByFormula: `{email} = '${email}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) return null;

    return recordToObject(records[0]) as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

export async function getAllCustomers(): Promise<User[]> {
  try {
    const records = await base(TABLES.USERS)
      .select({
        filterByFormula: `{role} = 'customer'`,
        sort: [{ field: 'name', direction: 'asc' }],
      })
      .all();

    return records.map((record) => recordToObject(record) as User);
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
}

export async function createUser(userData: Omit<User, 'id'>): Promise<User> {
  try {
    const record = await base(TABLES.USERS).create([{ fields: userData }]);
    return recordToObject(record[0]) as User;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  try {
    const record = await base(TABLES.USERS).update([
      {
        id: userId,
        fields: updates,
      },
    ]);
    return recordToObject(record[0]) as User;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Request password reset for user
 * In production, this would trigger an email with a reset link
 * For now, it just validates that the user exists
 */
export async function requestPasswordReset(email: string): Promise<boolean> {
  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return false;
    }

    // TODO: In production, implement:
    // 1. Generate a unique reset token
    // 2. Store token in Airtable with expiration time
    // 3. Send email with reset link using Airtable automation or email service
    // 4. Reset link would be: /reset-password?token=xxx

    console.log(`Password reset requested for: ${email}`);
    return true;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error;
  }
}

/**
 * Reset password with token
 * TODO: Implement in production with actual password hashing
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    // TODO: In production, implement:
    // 1. Validate reset token
    // 2. Check token expiration
    // 3. Hash new password with bcrypt
    // 4. Update user password in Airtable
    // 5. Invalidate reset token

    console.log(`Password reset with token: ${token}`);
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

// ============================================
// ITEM OPERATIONS
// ============================================

export async function getItemsByCustomerId(customerId: string): Promise<Item[]> {
  try {
    const records = await base(TABLES.ITEMS)
      .select({
        filterByFormula: `{customerId} = '${customerId}'`,
        sort: [{ field: 'createdAt', direction: 'desc' }],
      })
      .all();

    return records.map((record) => recordToObject(record) as Item);
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
}

export async function getItemByTrackingNumber(trackingNumber: string): Promise<Item | null> {
  try {
    const records = await base(TABLES.ITEMS)
      .select({
        filterByFormula: `{trackingNumber} = '${trackingNumber}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) return null;

    return recordToObject(records[0]) as Item;
  } catch (error) {
    console.error('Error fetching item:', error);
    throw error;
  }
}

export async function createItem(itemData: Omit<Item, 'id'>): Promise<Item> {
  // Declare cleanData outside try block so it's accessible in catch
  let cleanData: any = {};

  try {
    // Check if Airtable is configured
    if (!config.airtable.apiKey || !config.airtable.baseId) {
      console.warn('Airtable not configured, using demo mode for item creation');
      // Return mock item with generated ID
      const mockItem: Item = {
        id: 'item-' + Date.now(),
        ...itemData,
      } as Item;

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return mockItem;
    }

    // Clean the data - remove undefined values and ensure proper types
    cleanData = {
      trackingNumber: itemData.trackingNumber,
      // customerId will be handled below based on field type
      receivingDate: itemData.receivingDate,
      length: itemData.length,
      width: itemData.width,
      height: itemData.height,
      dimensionUnit: itemData.dimensionUnit,
      // cbm: Don't send if it's a computed field in Airtable
      // cbm: itemData.cbm,
      shippingMethod: itemData.shippingMethod,
      costUSD: itemData.costUSD,
      costCedis: itemData.costCedis,
      status: itemData.status,
      isDamaged: itemData.isDamaged,
      isMissing: itemData.isMissing,
      // createdAt and updatedAt: Don't send if they're auto-generated in Airtable
      // createdAt: itemData.createdAt,
      // updatedAt: itemData.updatedAt,
    };

    // Handle customerId - must be an Airtable record ID for linked records
    if (itemData.customerId) {
      if (itemData.customerId.startsWith('rec')) {
        // It's an Airtable record ID - send as linked record array
        cleanData.customerId = [itemData.customerId];
      } else {
        // It's NOT a record ID - need to look up the user first by email
        console.warn('customerId is not an Airtable record ID. Attempting to find user by email:', itemData.customerId);

        // Try to find user by email
        try {
          const userRecord = await base(TABLES.USERS)
            .select({
              filterByFormula: `{email} = '${itemData.customerId}'`,
              maxRecords: 1,
            })
            .firstPage();

          if (userRecord.length > 0) {
            // Found user - use their Airtable record ID
            cleanData.customerId = [userRecord[0].id];
            console.log('Found user record:', userRecord[0].id);
          } else {
            // User not found - throw error
            throw new Error(`Customer not found with email: ${itemData.customerId}. Please create the customer in Airtable Users table first, or use their Airtable record ID (starts with 'rec').`);
          }
        } catch (lookupError) {
          console.error('Failed to lookup customer:', lookupError);
          throw new Error(`Customer lookup failed: ${lookupError}`);
        }
      }
    }

    // Only add optional fields if they exist
    if (itemData.name) cleanData.name = itemData.name;
    if (itemData.containerNumber) cleanData.containerNumber = itemData.containerNumber;
    if (itemData.weight) cleanData.weight = itemData.weight;
    if (itemData.weightUnit) cleanData.weightUnit = itemData.weightUnit;
    if (itemData.cartonNumber) cleanData.cartonNumber = itemData.cartonNumber;

    // Handle photos array - Airtable attachments need specific format
    if (itemData.photos && itemData.photos.length > 0) {
      // Airtable expects attachments as array of objects with url property
      cleanData.photos = itemData.photos.map((url: string) => ({ url }));
    }

    console.log('Creating item in Airtable with data:', cleanData);

    const record = await base(TABLES.ITEMS).create([{ fields: cleanData }]);
    return recordToObject(record[0]) as Item;
  } catch (error: any) {
    console.error('Error creating item:', error);
    console.error('Item data that failed:', itemData);
    console.error('Clean data sent to Airtable:', cleanData);

    // Log detailed Airtable error
    if (error.error) {
      console.error('Airtable error details:', error.error);
    }
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.statusCode) {
      console.error('Status code:', error.statusCode);
    }

    throw error;
  }
}

export async function updateItem(itemId: string, updates: Partial<Item>): Promise<Item> {
  try {
    const record = await base(TABLES.ITEMS).update([
      {
        id: itemId,
        fields: updates,
      },
    ]);
    return recordToObject(record[0]) as Item;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
}

export async function getItemsByContainerNumber(containerNumber: string): Promise<Item[]> {
  try {
    const records = await base(TABLES.ITEMS)
      .select({
        filterByFormula: `{containerNumber} = '${containerNumber}'`,
      })
      .all();

    return records.map((record) => recordToObject(record) as Item);
  } catch (error) {
    console.error('Error fetching items by container:', error);
    throw error;
  }
}

// ============================================
// CONTAINER OPERATIONS
// ============================================

export async function getAllContainers(): Promise<Container[]> {
  try {
    const records = await base(TABLES.CONTAINERS)
      .select({
        sort: [{ field: 'receivingDate', direction: 'desc' }],
      })
      .all();

    return records.map((record) => recordToObject(record) as Container);
  } catch (error) {
    console.error('Error fetching containers:', error);
    throw error;
  }
}

export async function createContainer(containerData: Omit<Container, 'id'>): Promise<Container> {
  try {
    const record = await base(TABLES.CONTAINERS).create([{ fields: containerData }]);
    return recordToObject(record[0]) as Container;
  } catch (error) {
    console.error('Error creating container:', error);
    throw error;
  }
}

export async function updateContainer(containerId: string, updates: Partial<Container>): Promise<Container> {
  try {
    const record = await base(TABLES.CONTAINERS).update([
      {
        id: containerId,
        fields: updates,
      },
    ]);
    return recordToObject(record[0]) as Container;
  } catch (error) {
    console.error('Error updating container:', error);
    throw error;
  }
}

// ============================================
// INVOICE OPERATIONS
// ============================================

export async function getInvoicesByCustomerId(customerId: string): Promise<Invoice[]> {
  try {
    const records = await base(TABLES.INVOICES)
      .select({
        filterByFormula: `{customerId} = '${customerId}'`,
        sort: [{ field: 'createdAt', direction: 'desc' }],
      })
      .all();

    return records.map((record) => recordToObject(record) as Invoice);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
}

export async function createInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> {
  try {
    const record = await base(TABLES.INVOICES).create([{ fields: invoiceData }]);
    return recordToObject(record[0]) as Invoice;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

export async function updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice> {
  try {
    const record = await base(TABLES.INVOICES).update([
      {
        id: invoiceId,
        fields: updates,
      },
    ]);
    return recordToObject(record[0]) as Invoice;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
}

// ============================================
// SUPPORT REQUEST OPERATIONS
// ============================================

export async function getSupportRequestsByCustomerId(customerId: string): Promise<SupportRequest[]> {
  try {
    const records = await base(TABLES.SUPPORT_REQUESTS)
      .select({
        filterByFormula: `{customerId} = '${customerId}'`,
        sort: [{ field: 'createdAt', direction: 'desc' }],
      })
      .all();

    return records.map((record) => recordToObject(record) as SupportRequest);
  } catch (error) {
    console.error('Error fetching support requests:', error);
    throw error;
  }
}

export async function createSupportRequest(requestData: Omit<SupportRequest, 'id'>): Promise<SupportRequest> {
  try {
    const record = await base(TABLES.SUPPORT_REQUESTS).create([{ fields: requestData }]);
    return recordToObject(record[0]) as SupportRequest;
  } catch (error) {
    console.error('Error creating support request:', error);
    throw error;
  }
}

export async function updateSupportRequest(requestId: string, updates: Partial<SupportRequest>): Promise<SupportRequest> {
  try {
    const record = await base(TABLES.SUPPORT_REQUESTS).update([
      {
        id: requestId,
        fields: updates,
      },
    ]);
    return recordToObject(record[0]) as SupportRequest;
  } catch (error) {
    console.error('Error updating support request:', error);
    throw error;
  }
}

// ============================================
// ANNOUNCEMENT OPERATIONS
// ============================================

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  try {
    const records = await base(TABLES.ANNOUNCEMENTS)
      .select({
        filterByFormula: '{isActive} = TRUE()',
        sort: [{ field: 'createdAt', direction: 'desc' }],
      })
      .all();

    return records.map((record) => recordToObject(record) as Announcement);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }
}

export async function createAnnouncement(announcementData: Omit<Announcement, 'id'>): Promise<Announcement> {
  try {
    const record = await base(TABLES.ANNOUNCEMENTS).create([{ fields: announcementData }]);
    return recordToObject(record[0]) as Announcement;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
}
