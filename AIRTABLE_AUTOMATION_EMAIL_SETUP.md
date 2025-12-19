# Airtable Automation - Automatic Customer Credential Emails

This guide shows you how to set up Airtable Automations to automatically send login credentials to customers when their accounts are created by the Ghana team.

## Overview

When a team member creates a new customer account:
1. Customer record is created in Airtable Users table
2. Airtable automation detects the new customer
3. Email is automatically sent with login credentials
4. Customer receives professional welcome email

## Prerequisites

- Airtable account with automation features (available on Free plan)
- Access to your AFREQ Airtable base
- Users table properly configured

## Step-by-Step Setup

### Step 1: Add Temporary Password Field to Users Table

Since Airtable automations need to access the temporary password before it's hashed, we need a temporary field.

1. Open your Airtable base
2. Go to the **Users** table
3. Add a new field:
   - Field name: `tempPassword`
   - Field type: **Single line text**
   - Description: "Temporary password for new customers (auto-cleared after email sent)"

### Step 2: Create the Automation

1. **Open Automations**
   - In your Airtable base, click the **Automations** button (top right)
   - Click **"Create automation"**

2. **Name Your Automation**
   - Name: "Send Customer Credentials Email"
   - Description: "Automatically email login credentials to new customers"

### Step 3: Configure the Trigger

1. **Select Trigger Type**
   - Click **"Choose trigger"**
   - Select **"When record created"**

2. **Configure Trigger**
   - Table: **Users**
   - View: Leave as "All records" or create a filtered view

3. **Add Condition** (Click "Add condition" under the trigger)
   - Field: **role**
   - Operator: **is**
   - Value: **customer**

   AND

   - Field: **isFirstLogin**
   - Operator: **is**
   - Value: **Checked** (true)

This ensures the automation only runs for new customer accounts created by the team.

### Step 4: Configure the Email Action

1. **Add Action**
   - Click **"+ Add action"**
   - Select **"Send email"**

2. **Configure Email Details**

   **To:** (Click to insert field)
   - Select the **email** field from the trigger record

   **From name:**
   ```
   AFREQ Logistics
   ```

   **Reply-to:** (Your support email)
   ```
   support@afreq.com
   ```

   **Subject:**
   ```
   Welcome to AFREQ Logistics - Your Account Details
   ```

   **Message:** (Click to switch to "Customize email body")

   ```html
   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
     <!-- Header -->
     <div style="background-color: #009EF7; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0;">
       <h1 style="margin: 0; font-size: 28px;">AFREQ Logistics</h1>
       <p style="margin: 10px 0 0 0; font-size: 16px;">Welcome to Your Account</p>
     </div>

     <!-- Content -->
     <div style="background-color: #f8f9fa; padding: 30px; border: 1px solid #e4e6ef;">
       <h2 style="color: #333; margin-top: 0;">Hello {name},</h2>

       <p style="color: #555; line-height: 1.6;">
         Welcome to AFREQ Logistics! Your customer account has been created successfully.
       </p>

       <p style="color: #555; line-height: 1.6;">
         You can now track your shipments, view item details, and manage your deliveries through our online platform.
       </p>

       <!-- Credentials Box -->
       <div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px;">
         <h3 style="margin-top: 0; color: #333;">Your Login Credentials</h3>

         <p style="margin: 10px 0;">
           <strong style="color: #333;">Email:</strong>
           <span style="color: #555;">{email}</span>
         </p>

         <p style="margin: 10px 0;">
           <strong style="color: #333;">Temporary Password:</strong>
         </p>
         <div style="background-color: white; padding: 15px; text-align: center; border-radius: 5px; margin: 10px 0;">
           <span style="font-size: 24px; font-weight: bold; color: #d63384; letter-spacing: 2px;">{tempPassword}</span>
         </div>
       </div>

       <!-- Security Warning -->
       <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;">
         <strong>⚠️ Important Security Notice:</strong>
         <ul style="margin: 10px 0; padding-left: 20px;">
           <li>This is a temporary password</li>
           <li>You will be required to change it on your first login</li>
           <li>Do not share this password with anyone</li>
           <li>If you didn't request this account, please contact us immediately</li>
         </ul>
       </div>

       <!-- Login Button -->
       <div style="text-align: center; margin: 30px 0;">
         <a href="https://your-domain.com/login"
            style="display: inline-block; background-color: #009EF7; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
           Login to Your Account
         </a>
       </div>

       <!-- Next Steps -->
       <h3 style="color: #333;">What's Next?</h3>
       <ol style="color: #555; line-height: 1.8; padding-left: 20px;">
         <li>Click the "Login to Your Account" button above</li>
         <li>Enter your email and temporary password</li>
         <li>Create a new secure password when prompted</li>
         <li>Complete your profile information</li>
         <li>Start tracking your shipments!</li>
       </ol>

       <p style="color: #555; line-height: 1.6; margin-top: 20px;">
         If you have any questions or need assistance, please don't hesitate to contact our support team.
       </p>

       <p style="color: #555; line-height: 1.6;">
         Best regards,<br>
         <strong>AFREQ Logistics Team</strong>
       </p>
     </div>

     <!-- Footer -->
     <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border: 1px solid #e4e6ef; border-top: none; border-radius: 0 0 5px 5px;">
       <p style="color: #7e8299; font-size: 12px; margin: 5px 0;">
         This is an automated email from AFREQ Logistics. Please do not reply to this email.
       </p>
       <p style="color: #7e8299; font-size: 12px; margin: 5px 0;">
         If you need help, please contact our support team.
       </p>
       <p style="color: #7e8299; font-size: 12px; margin: 5px 0;">
         © 2025 AFREQ Logistics. All rights reserved.
       </p>
     </div>
   </div>
   ```

   **IMPORTANT:** Replace `https://your-domain.com/login` with your actual login URL.

3. **Field Mappings**

   In the email template above, click on the `{name}`, `{email}`, and `{tempPassword}` placeholders to insert the actual fields:
   - `{name}` → Insert field: **name**
   - `{email}` → Insert field: **email**
   - `{tempPassword}` → Insert field: **tempPassword**

### Step 5: Add Password Cleanup Action (Optional but Recommended)

After sending the email, clear the temporary password for security:

1. **Add Another Action**
   - Click **"+ Add action"**
   - Select **"Update record"**

2. **Configure Update**
   - Record ID: Use the record ID from trigger
   - Table: **Users**
   - Fields to update:
     - **tempPassword**: (leave empty to clear)

### Step 6: Test the Automation

1. **Enable Test Mode**
   - Click **"Test automation"** button
   - Select a test customer record (or create one)

2. **Review Test Email**
   - Check if the email is sent correctly
   - Verify all fields populate properly
   - Confirm formatting looks good

3. **Turn On Automation**
   - Once testing is successful, click **"Turn on automation"**

## Update the Frontend Code

Now we need to update the frontend to store the temporary password in the `tempPassword` field before hashing.

### Modify the createUser Function

Edit `/Users/breezyyy/Downloads/Afreq/frontend/src/services/airtable.ts`:

Find the `createUser` function (around line 146) and update the fields being sent to Airtable to include `tempPassword`:

```typescript
// Create the record - explicitly list all fields to ensure password is included
const record = await base(TABLES.USERS).create([{
  fields: {
    name: userDataWithFirstLogin.name,
    email: userDataWithFirstLogin.email,
    phone: userDataWithFirstLogin.phone || undefined,
    role: userDataWithFirstLogin.role,
    password: userDataWithFirstLogin.password, // Hashed password
    tempPassword: userData.password, // PLAIN TEXT temporary password for email
    isFirstLogin: userDataWithFirstLogin.isFirstLogin,
    address: userDataWithFirstLogin.address || undefined,
  }
}]);
```

**Security Note:** The `tempPassword` field is automatically cleared by the Airtable automation after the email is sent, so it's only stored temporarily.

## Verification Checklist

Before going live, verify:

- [ ] `tempPassword` field exists in Users table
- [ ] Automation trigger is configured for new customer records
- [ ] Automation condition checks for `role = customer` AND `isFirstLogin = true`
- [ ] Email template has all field mappings correct
- [ ] Login URL in email is correct
- [ ] Automation cleanup step clears `tempPassword` after email
- [ ] Test email sent successfully
- [ ] Automation is turned ON

## Alternative: Plain Text Email

If you prefer a simpler plain text email, use this template instead:

```
Hello {name},

Welcome to AFREQ Logistics! Your customer account has been created successfully.

You can now track your shipments, view item details, and manage your deliveries through our online platform.

=== YOUR LOGIN CREDENTIALS ===

Email: {email}
Temporary Password: {tempPassword}

Login URL: https://your-domain.com/login

=== IMPORTANT SECURITY NOTICE ===

- This is a temporary password
- You will be required to change it on your first login
- Do not share this password with anyone
- If you didn't request this account, please contact us immediately

=== NEXT STEPS ===

1. Visit the login page
2. Enter your email and temporary password
3. Create a new secure password when prompted
4. Complete your profile information
5. Start tracking your shipments!

If you have any questions or need assistance, please contact our support team.

Best regards,
AFREQ Logistics Team

---
This is an automated email from AFREQ Logistics.
© 2025 AFREQ Logistics. All rights reserved.
```

## Monitoring and Troubleshooting

### View Automation Runs

1. Go to Automations in your base
2. Click on "Send Customer Credentials Email"
3. Click **"Run history"** tab
4. View successful and failed runs

### Common Issues

**Email not sending:**
- Check automation is turned ON
- Verify trigger conditions are met
- Check email field is valid
- Review run history for errors

**Wrong password in email:**
- Verify `tempPassword` field mapping is correct
- Check frontend is sending plain password to `tempPassword`
- Confirm password is being generated before hashing

**Email formatting issues:**
- Use "Preview" in Airtable automation
- Test with a real email address
- Check HTML rendering in different email clients

**Password not clearing:**
- Verify cleanup action is configured
- Check update action has correct record ID
- Review automation run history

## Benefits of Airtable Automation

✅ **No External Services Needed** - Everything within Airtable
✅ **Reliable Delivery** - Airtable handles email delivery
✅ **Automatic Tracking** - View all sent emails in run history
✅ **No API Costs** - Included in Airtable subscription
✅ **Easy to Modify** - Update email template anytime
✅ **Built-in Testing** - Test before going live

## Limits and Quotas

Airtable automation email limits:
- **Free plan**: 100 automation runs per month
- **Plus plan**: 25,000 automation runs per month
- **Pro plan**: 100,000 automation runs per month

Each customer creation counts as 1 automation run.

## Next Steps

After setting up the automation:

1. **Test with Real Data**
   - Create a test customer account through the app
   - Verify email is received
   - Confirm credentials work for login

2. **Monitor Performance**
   - Check automation run history weekly
   - Review failed runs and fix issues
   - Update email template based on customer feedback

3. **Consider Additional Automations**
   - Password reset emails
   - Shipment arrival notifications
   - Invoice ready notifications
   - Support request confirmations

## Support

If you encounter issues:
- Check Airtable Automation documentation
- Review the automation run history for error messages
- Contact AFREQ technical support
- Check Airtable community forums

---

**Last Updated:** December 2025
**Version:** 1.0
