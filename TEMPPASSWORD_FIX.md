# TempPassword Field Setup in Airtable

## Issue
When creating a new customer account, the temporary password is not appearing in Airtable, so the email automation cannot send it to customers.

## Solution
You need to add the `tempPassword` field to your Airtable **Users** table.

## Step-by-Step Instructions

### 1. Open Your Airtable Base
1. Go to [airtable.com](https://airtable.com)
2. Open your AFREQ base
3. Navigate to the **Users** table

### 2. Add the tempPassword Field
1. Click the **+** button to add a new field (or click on any column header and select "Insert left/right")
2. Configure the new field:
   - **Field name:** `tempPassword`
   - **Field type:** Single line text
   - **Description:** "Temporary password for email automation (auto-cleared after email sent)"

### 3. Verify the Field
After creating the field, you should see a new column called `tempPassword` in your Users table.

## How It Works

When a Ghana team member creates a new customer account through the Item Details modal:

1. **Password Generation:** System generates a random 8-character password (e.g., "9DJXEH9Y")
2. **Dual Storage:**
   - `password` field: Stores the **hashed** version for secure login authentication
   - `tempPassword` field: Stores the **plain text** version temporarily for email automation
3. **Email Automation:** Airtable automation reads `tempPassword` and sends it to the customer via email
4. **Security:** Airtable automation should clear the `tempPassword` field after sending the email

## Testing the Fix

After adding the `tempPassword` field:

1. **Create a test customer account:**
   - Go to Ghana Team → Tagging page
   - Click on any untagged item
   - Click "Create New Customer"
   - Fill in customer details
   - Click "Create Customer Account"

2. **Check Airtable:**
   - Open your Users table in Airtable
   - Find the newly created customer record
   - You should now see the temporary password in the `tempPassword` field

3. **Check Email:**
   - If you've set up the Airtable automation (see [AIRTABLE_AUTOMATION_EMAIL_SETUP.md](AIRTABLE_AUTOMATION_EMAIL_SETUP.md))
   - The customer should receive an email with their login credentials
   - The `tempPassword` field should be cleared after the email is sent

## Important Notes

- The `tempPassword` field is **only populated** when accounts are created by the Ghana team
- Self-signup accounts (if you add that feature) will NOT have a `tempPassword` value
- This field should be **hidden from customer view** for security
- Airtable automation should **clear this field** after sending the email

## Related Files

- Email automation setup: [AIRTABLE_AUTOMATION_EMAIL_SETUP.md](AIRTABLE_AUTOMATION_EMAIL_SETUP.md)
- Complete Airtable setup: [AIRTABLE_SETTINGS_SETUP.md](AIRTABLE_SETTINGS_SETUP.md)
- Email service options: [EMAIL_SETUP.md](EMAIL_SETUP.md)

## Troubleshooting

### tempPassword field is still empty after creating a customer

**Possible causes:**
1. Field name is misspelled - must be exactly `tempPassword` (case-sensitive)
2. Field type is wrong - must be "Single line text"
3. Browser console shows errors - check developer tools (F12) for error messages

### Email is not being sent

**Possible causes:**
1. Airtable automation is not set up - see [AIRTABLE_AUTOMATION_EMAIL_SETUP.md](AIRTABLE_AUTOMATION_EMAIL_SETUP.md)
2. Automation is turned OFF - check automation status in Airtable
3. Trigger conditions don't match - verify automation triggers on correct conditions

## Debug Mode

The system includes debug logging. To view logs:

1. Open browser developer tools (F12)
2. Go to Console tab
3. Create a new customer account
4. Look for log messages starting with "DEBUG -"
5. You should see: `DEBUG - Adding tempPassword field: [password]`

If you don't see this log, the password is not being sent to Airtable.
