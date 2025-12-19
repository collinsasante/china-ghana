import Airtable from 'airtable';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';
import type {
  User,
  Item,
  Container,
  Invoice,
  SupportRequest,
  Announcement,
  Warehouse,
  SystemSettings,
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
  SETTINGS: 'Settings',
  WAREHOUSES: 'Warehouses',
} as const;

/**
 * Convert Airtable record to our app format
 */
function recordToObject<T>(record: any): T & { id: string } {
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
        // Explicitly request all fields including password
        fields: ['name', 'email', 'phone', 'role', 'password', 'isFirstLogin', 'passwordChangedAt', 'address'],
      })
      .firstPage();

    if (records.length === 0) return null;

    const user = recordToObject(records[0]) as User;

    // Debug log to see what we got
    console.error('DEBUG - getUserByEmail returned:', {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      passwordValue: user.password ? `${user.password.substring(0, 10)}...` : 'undefined',
      allKeys: Object.keys(user)
    });

    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Verify password against stored hash
 * @param plainPassword - The plain text password to verify
 * @param hashedPassword - The hashed password from the database
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
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

export async function updateUserPassword(userId: string, newPassword: string): Promise<User> {
  try {
    // Hash the password before storing (production-ready)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const record = await base(TABLES.USERS).update([
      {
        id: userId,
        fields: {
          password: hashedPassword,
          isFirstLogin: false,
          passwordChangedAt: new Date().toISOString(),
        },
      },
    ]);

    return recordToObject(record[0]) as User;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

export async function toggleUserFirstLogin(userId: string, isFirstLogin: boolean): Promise<User> {
  try {
    const record = await base(TABLES.USERS).update([
      {
        id: userId,
        fields: {
          isFirstLogin: isFirstLogin,
        },
      },
    ]);

    return recordToObject(record[0]) as User;
  } catch (error) {
    console.error('Error toggling isFirstLogin:', error);
    throw error;
  }
}

export async function createUser(userData: Omit<User, 'id'>, createdByTeam: boolean = false): Promise<User> {
  try {
    console.error('DEBUG - createUser called with:', {
      email: userData.email,
      hasPassword: !!userData.password,
      passwordLength: userData.password?.length,
      role: userData.role,
      createdByTeam
    });

    // Hash the password before storing
    const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : undefined;

    console.error('DEBUG - Password hashed:', {
      hadOriginalPassword: !!userData.password,
      hasHashedPassword: !!hashedPassword,
      hashedLength: hashedPassword?.length
    });

    // Only set isFirstLogin: true for accounts created by Ghana team
    // Self-signup accounts don't need password reset
    const userDataWithFirstLogin = {
      ...userData,
      password: hashedPassword,
      isFirstLogin: createdByTeam, // Only true if created by team
    };

    console.error('DEBUG - Sending to Airtable:', {
      email: userDataWithFirstLogin.email,
      hasPassword: !!userDataWithFirstLogin.password,
      passwordValue: userDataWithFirstLogin.password ? `${userDataWithFirstLogin.password.substring(0, 15)}...` : 'undefined',
      isFirstLogin: userDataWithFirstLogin.isFirstLogin,
      createdByTeam: createdByTeam,
      tempPasswordValue: createdByTeam ? userData.password : 'not-set',
      allFields: Object.keys(userDataWithFirstLogin)
    });

    // Create the record - explicitly list all fields to ensure password is included
    const fieldsToCreate: any = {
      name: userDataWithFirstLogin.name,
      email: userDataWithFirstLogin.email,
      phone: userDataWithFirstLogin.phone || undefined,
      role: userDataWithFirstLogin.role,
      password: userDataWithFirstLogin.password, // Hashed password for authentication
      isFirstLogin: userDataWithFirstLogin.isFirstLogin,
      address: userDataWithFirstLogin.address || undefined,
    };

    // Only add tempPassword if created by team (for email automation)
    if (createdByTeam && userData.password) {
      fieldsToCreate.tempPassword = userData.password; // Plain text password for Airtable email automation
      console.error('DEBUG - Adding tempPassword field:', userData.password);
    }

    const record = await base(TABLES.USERS).create([{
      fields: fieldsToCreate
    }]);
    const createdUser = recordToObject(record[0]) as User;

    console.error('DEBUG - User created in Airtable:', {
      id: createdUser.id,
      email: createdUser.email,
      hasPasswordInResponse: !!createdUser.password,
      isFirstLoginInResponse: createdUser.isFirstLogin,
      allFieldsInResponse: Object.keys(createdUser)
    });

    return createdUser;
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
export async function resetPassword(_token: string, _newPassword: string): Promise<boolean> {
  try {
    // TODO: In production, implement:
    // 1. Validate reset token
    // 2. Check token expiration
    // 3. Hash new password with bcrypt
    // 4. Update user password in Airtable
    // 5. Invalidate reset token

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
    // First, get ALL items to see what's in the table
    const allRecords = await base(TABLES.ITEMS)
      .select({
        sort: [{ field: 'receivingDate', direction: 'desc' }],
      })
      .all();

    // Now try to filter by customer
    // IMPORTANT: Your Airtable field is called 'customerId_old' not 'customerId'

    // Since Airtable's formula filtering for linked records can be tricky,
    // let's fetch all items and filter in JavaScript for now
    const filteredRecords = allRecords.filter((record) => {
      const custId = (record.fields as any).customerId_old;
      if (Array.isArray(custId) && custId.length > 0) {
        return custId[0] === customerId;
      }
      return false;
    });

    return filteredRecords.map((record) => recordToObject(record) as Item);
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

    const obj = recordToObject(records[0]) as any;

    // Map customerId_old (array) to customerId (string)
    if (obj.customerId_old && Array.isArray(obj.customerId_old) && obj.customerId_old.length > 0) {
      obj.customerId = obj.customerId_old[0];
    } else if (!obj.customerId && obj.customerId_old) {
      obj.customerId = obj.customerId_old;
    }

    return obj as Item;
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
    // IMPORTANT: Your Airtable field is called 'customerId_old' not 'customerId'
    if (itemData.customerId) {
      if (itemData.customerId.startsWith('rec')) {
        // It's an Airtable record ID - send as linked record array
        cleanData.customerId_old = [itemData.customerId];
      } else {
        // It's NOT a record ID - need to look up the user first by email

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
            cleanData.customerId_old = [userRecord[0].id];
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
      // Photos can be strings or objects with url and order
      cleanData.photos = itemData.photos.map((photo: string | { url: string; order: number }) =>
        typeof photo === 'string' ? { url: photo } : { url: photo.url }
      );
    }

    const record = await base(TABLES.ITEMS).create([{ fields: cleanData }]);
    return recordToObject(record[0]) as Item;
  } catch (error: any) {
    console.error('Error creating item:', error);

    throw error;
  }
}

export async function updateItem(itemId: string, updates: Partial<Item>): Promise<Item> {
  try {
    // Map fields to match Airtable schema
    const mappedUpdates: any = { ...updates };

    // Handle customerId - must be sent as array for linked record field
    // IMPORTANT: Your Airtable field is called 'customerId_old' not 'customerId'
    if (updates.customerId !== undefined) {
      if (updates.customerId.startsWith('rec')) {
        // It's an Airtable record ID - send as linked record array
        mappedUpdates.customerId_old = [updates.customerId];
      } else {
        // It's NOT a record ID - need to look up the user first by email

        try {
          const userRecord = await base(TABLES.USERS)
            .select({
              filterByFormula: `{email} = '${updates.customerId}'`,
              maxRecords: 1,
            })
            .firstPage();

          if (userRecord.length > 0) {
            // Found user - use their Airtable record ID
            mappedUpdates.customerId_old = [userRecord[0].id];
          } else {
            // User not found - throw error
            throw new Error(`Customer not found with email: ${updates.customerId}. Please create the customer in Airtable Users table first, or use their Airtable record ID (starts with 'rec').`);
          }
        } catch (lookupError) {
          console.error('Failed to lookup customer:', lookupError);
          throw new Error(`Customer lookup failed: ${lookupError}`);
        }
      }
      // Remove the original customerId field as we've mapped it to customerId_old
      delete mappedUpdates.customerId;
    }

    // Handle photos - ensure proper Airtable attachment format
    if (updates.photos !== undefined) {
      mappedUpdates.photos = updates.photos.map((photo: string | { url: string; order: number }) =>
        typeof photo === 'string' ? { url: photo } : { url: photo.url }
      );
    }

    // Remove fields that Airtable auto-manages or that don't exist
    delete mappedUpdates.id;
    delete mappedUpdates.createdAt;
    delete mappedUpdates.updatedAt;

    const record = await base(TABLES.ITEMS).update([
      {
        id: itemId,
        fields: mappedUpdates,
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

    return records.map((record) => {
      const obj = recordToObject(record) as any;

      // Map customerId_old (array) to customerId (string)
      if (obj.customerId_old && Array.isArray(obj.customerId_old) && obj.customerId_old.length > 0) {
        obj.customerId = obj.customerId_old[0];
      } else if (!obj.customerId && obj.customerId_old) {
        obj.customerId = obj.customerId_old;
      }

      return obj as Item;
    });
  } catch (error) {
    console.error('Error fetching items by container:', error);
    throw error;
  }
}

export async function getAllItems(): Promise<Item[]> {
  try {
    const records = await base(TABLES.ITEMS)
      .select({
        // No sorting - Airtable returns in natural order (creation order)
      })
      .all();

    return records.map((record) => {
      const obj = recordToObject(record) as any;

      // Map customerId_old (array) to customerId (string)
      // Airtable returns linked records as arrays, but our app expects strings
      if (obj.customerId_old && Array.isArray(obj.customerId_old) && obj.customerId_old.length > 0) {
        obj.customerId = obj.customerId_old[0];
      } else if (!obj.customerId && obj.customerId_old) {
        // If customerId_old exists but not as expected array, handle it
        obj.customerId = obj.customerId_old;
      }

      return obj as Item;
    });
  } catch (error) {
    console.error('Error fetching all items:', error);
    throw error;
  }
}

export async function deleteItem(itemId: string): Promise<void> {
  try {
    await base(TABLES.ITEMS).destroy([itemId]);
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
}

// ============================================
// CONTAINER OPERATIONS
// ============================================

export async function getAllContainers(): Promise<Container[]> {
  try {
    console.log('[Airtable] getAllContainers - Fetching from table:', TABLES.CONTAINERS);
    const records = await base(TABLES.CONTAINERS)
      .select({
        sort: [{ field: 'receivingDate', direction: 'desc' }],
      })
      .all();

    console.log('[Airtable] getAllContainers - Raw records count:', records.length);
    console.log('[Airtable] getAllContainers - First record (if exists):', records[0]?.fields);

    const containers = records.map((record) => {
      const obj = recordToObject(record) as any;
      return {
        ...obj,
        estimatedArrival: obj.expectedArrivalGhana || obj.estimatedArrival, // Map expectedArrivalGhana to estimatedArrival
        shippingMethod: obj.shippingMethod || 'sea', // Default shipping method
        departureDate: obj.departureDate || undefined, // Optional departure date
      } as Container;
    });

    console.log('[Airtable] getAllContainers - Processed containers:', containers);
    return containers;
  } catch (error) {
    console.error('[Airtable] Error fetching containers:', error);
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

/**
 * Update all items in a container with the given updates
 * Useful for bulk status changes when container arrives
 */
export async function updateItemsByContainer(containerNumber: string, updates: Partial<Item>): Promise<number> {
  try {
    // Get all items in the container
    const items = await getItemsByContainerNumber(containerNumber);

    if (items.length === 0) {
      return 0;
    }

    // Prepare bulk update - Airtable allows up to 10 records per batch
    const batchSize = 10;
    let updatedCount = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const updateRecords = batch.map(item => ({
        id: item.id,
        fields: updates as any, // Type cast to avoid Airtable FieldSet issues
      }));

      await base(TABLES.ITEMS).update(updateRecords);
      updatedCount += updateRecords.length;
    }

    return updatedCount;
  } catch (error) {
    console.error('Error updating items by container:', error);
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

    return records.map((record) => {
      const obj = recordToObject(record) as any;
      return {
        ...obj,
        totalAmount: obj.total || obj.totalAmount || 0, // Map total to totalAmount
        issueDate: obj.createdAt || obj.issueDate, // Map createdAt to issueDate
        description: obj.description || '', // Ensure description exists
        notes: obj.notes || undefined, // Optional notes
      } as Invoice;
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
}

export async function createInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> {
  try {
    const record = await base(TABLES.INVOICES).create([{ fields: invoiceData as any }]);
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
        fields: updates as any,
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

    return records.map((record) => {
      const obj = recordToObject(record) as any;

      // Map customerId from array to string
      if (obj.customerId && Array.isArray(obj.customerId) && obj.customerId.length > 0) {
        obj.customerId = obj.customerId[0];
      }

      return {
        ...obj,
        message: obj.description || obj.message, // Map description to message
        category: obj.category || obj.type || 'general', // Map type to category
        priority: obj.priority || 'normal', // Default priority
      } as SupportRequest;
    });
  } catch (error) {
    console.error('Error fetching support requests:', error);
    throw error;
  }
}

export async function getAllSupportRequests(): Promise<SupportRequest[]> {
  try {
    const records = await base(TABLES.SUPPORT_REQUESTS)
      .select({
        sort: [{ field: 'createdAt', direction: 'desc' }],
      })
      .all();

    return records.map((record) => {
      const obj = recordToObject(record) as any;

      // Map customerId from array to string
      if (obj.customerId && Array.isArray(obj.customerId) && obj.customerId.length > 0) {
        obj.customerId = obj.customerId[0];
      }

      return obj as SupportRequest;
    });
  } catch (error) {
    console.error('Error fetching all support requests:', error);
    throw error;
  }
}

export async function updateSupportRequestStatus(requestId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed'): Promise<SupportRequest> {
  try {
    const record = await base(TABLES.SUPPORT_REQUESTS).update([
      {
        id: requestId,
        fields: {
          status: status,
          updatedAt: new Date().toISOString(),
        },
      },
    ]);

    const obj = recordToObject(record[0]) as any;

    // Map customerId from array to string
    if (obj.customerId && Array.isArray(obj.customerId) && obj.customerId.length > 0) {
      obj.customerId = obj.customerId[0];
    }

    return obj as SupportRequest;
  } catch (error) {
    console.error('Error updating support request status:', error);
    throw error;
  }
}

export async function createSupportRequest(requestData: Omit<SupportRequest, 'id'>): Promise<SupportRequest> {
  try {
    // Clean data - remove auto-generated fields and format for Airtable
    const cleanData: any = {
      subject: requestData.subject,
      description: requestData.description,
      message: requestData.message,
      category: requestData.category,
      status: requestData.status,
    };

    // Add optional fields if present
    if (requestData.customerId) {
      // customerId must be sent as array for linked record field
      cleanData.customerId = [requestData.customerId];
    }

    if (requestData.relatedTrackingNumber) {
      cleanData.relatedTrackingNumber = requestData.relatedTrackingNumber;
    }

    // Note: Do NOT send createdAt, updatedAt - Airtable auto-generates these
    // Note: Do NOT send customerName, customerEmail - these are lookup fields

    const record = await base(TABLES.SUPPORT_REQUESTS).create([{ fields: cleanData }]);
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

    return records.map((record) => {
      const obj = recordToObject(record) as any;
      return {
        ...obj,
        message: obj.content || obj.message, // Map content to message
        type: obj.type || 'general', // Default type if missing
      } as Announcement;
    });
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

// ============================================
// SETTINGS OPERATIONS
// ============================================

/**
 * Get system settings (exchange rates, shipping costs)
 * There should only be one settings record with id='default'
 */
export async function getSystemSettings(): Promise<SystemSettings | null> {
  try {
    const records = await base(TABLES.SETTINGS)
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

/**
 * Update system settings
 * Updates the default settings record with new values
 */
export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  try {
    // Find the default settings record
    const records = await base(TABLES.SETTINGS)
      .select({
        filterByFormula: `{id} = 'default'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      throw new Error('Settings record not found');
    }

    const record = await base(TABLES.SETTINGS).update([
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

// ============================================
// WAREHOUSE OPERATIONS
// ============================================

/**
 * Get all warehouses (active and inactive)
 */
export async function getAllWarehouses(): Promise<Warehouse[]> {
  try {
    const records = await base(TABLES.WAREHOUSES)
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

/**
 * Get active warehouses, optionally filtered by type
 * @param type - Optional filter: 'origin' for shipping warehouses, 'destination' for receiving warehouses
 */
export async function getActiveWarehouses(type?: 'origin' | 'destination'): Promise<Warehouse[]> {
  try {
    let formula = '{isActive} = TRUE()';

    if (type === 'origin') {
      formula = 'AND({isActive} = TRUE(), {isOrigin} = TRUE())';
    } else if (type === 'destination') {
      formula = 'AND({isActive} = TRUE(), {isDestination} = TRUE())';
    }

    const records = await base(TABLES.WAREHOUSES)
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

/**
 * Create a new warehouse
 */
export async function createWarehouse(warehouseData: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Promise<Warehouse> {
  try {
    const record = await base(TABLES.WAREHOUSES).create([{
      fields: warehouseData
    }]);
    return recordToObject(record[0]) as Warehouse;
  } catch (error) {
    console.error('Error creating warehouse:', error);
    throw error;
  }
}

/**
 * Update an existing warehouse
 */
export async function updateWarehouse(warehouseId: string, updates: Partial<Warehouse>): Promise<Warehouse> {
  try {
    const record = await base(TABLES.WAREHOUSES).update([
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

/**
 * Delete a warehouse
 */
export async function deleteWarehouse(warehouseId: string): Promise<void> {
  try {
    await base(TABLES.WAREHOUSES).destroy([warehouseId]);
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    throw error;
  }
}
