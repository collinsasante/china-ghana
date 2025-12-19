# Email Service Setup Guide

The AFREQ system automatically sends customer credentials via email when a new customer account is created by the team.

## 🎯 Recommended: Airtable Automation (Best Option)

**For complete step-by-step instructions, see [AIRTABLE_AUTOMATION_EMAIL_SETUP.md](AIRTABLE_AUTOMATION_EMAIL_SETUP.md)**

### Why Airtable Automation?

✅ **No External Services** - Everything within Airtable
✅ **Reliable Delivery** - Airtable handles email sending
✅ **Free on All Plans** - No additional costs
✅ **Easy to Set Up** - 10-minute configuration
✅ **Built-in Tracking** - View email history in Airtable
✅ **No Code Changes** - Just configure and go

### Quick Setup Summary

1. Add `tempPassword` field to Users table in Airtable
2. Create Airtable automation triggered on new customer creation
3. Configure email template with customer credentials
4. Turn on automation

**That's it!** The system is already configured to work with Airtable automations.

---

## How It Works

When a team member creates a new customer account through the Item Details modal:
1. A temporary password is generated automatically
2. The password is stored temporarily in Airtable's `tempPassword` field
3. Airtable automation detects the new customer and sends email automatically
4. The email includes:
   - Welcome message
   - Customer's email address
   - Temporary password
   - Login link
   - Instructions for first-time login
   - Security reminder to change password
5. Airtable automation clears the `tempPassword` field after sending (for security)

---

## Alternative Email Methods

If you prefer not to use Airtable Automation, the system also supports:

### Option 1: Backend API

Create a backend API endpoint at `/api/send-email` that accepts:
```json
{
  "to": "customer@example.com",
  "subject": "Your AFREQ Logistics Account - Login Credentials",
  "html": "<html>...</html>",
  "text": "Plain text version"
}
```

This is the most secure option as it keeps email service credentials on the server.

### Option 2: EmailJS (Frontend Solution)

EmailJS is a free service that works directly from the frontend.

**Setup Steps:**

1. **Create EmailJS Account**
   - Go to https://www.emailjs.com/
   - Sign up for a free account (300 emails/month free)

2. **Add Email Service**
   - In EmailJS dashboard, click "Email Services"
   - Add your email provider (Gmail, Outlook, etc.)
   - Follow the authentication steps

3. **Create Email Template**
   - Go to "Email Templates"
   - Create a new template
   - Use these template variables:
     - `{{to_name}}` - Customer name
     - `{{to_email}}` - Customer email
     - `{{customer_email}}` - Customer email (for display)
     - `{{temporary_password}}` - The generated password
     - `{{login_url}}` - Login page URL

   Example template:
   ```
   Hello {{to_name}},

   Your AFREQ Logistics account has been created!

   Login Details:
   Email: {{customer_email}}
   Temporary Password: {{temporary_password}}

   Login at: {{login_url}}

   Please change your password on first login.

   Best regards,
   AFREQ Team
   ```

4. **Get Your Credentials**
   - Service ID: Found in "Email Services" section
   - Template ID: Found in your email template
   - Public Key: Found in "Account" -> "General"

5. **Add to Environment Variables**

   Create or update `.env` file in `frontend/` directory:
   ```env
   VITE_EMAIL_SERVICE_ID=your_service_id
   VITE_EMAIL_TEMPLATE_ID=your_template_id
   VITE_EMAIL_PUBLIC_KEY=your_public_key
   ```

### Option 3: Airtable Automations

Set up an Airtable automation that triggers when a new user is created:

1. **Create Automation in Airtable**
   - Go to your Airtable base
   - Click "Automations"
   - Create new automation

2. **Trigger Configuration**
   - Trigger: "When record is created"
   - Table: "Users"
   - Condition: `{role} = 'customer'` AND `{isFirstLogin} = TRUE()`

3. **Action Configuration**
   - Action: "Send email"
   - To: `{email}` field
   - Subject: "Your AFREQ Logistics Account"
   - Body: Include `{name}`, `{email}`, and note about temporary password

**Note:** Airtable automations cannot access the temporary password after it's hashed, so you would need to modify the system to store it temporarily or use one of the other methods.

## Testing Email Functionality

### Without Email Service Configured

When no email service is configured:
- The system will log the email details to the browser console
- A warning notification will be shown to the team member
- The password modal will still display so credentials can be copied manually

### With Email Service Configured

When email service is properly configured:
- A success notification will confirm the email was sent
- The customer will receive the email within a few seconds
- The password modal will still display as a backup

## Email Content

The automatically generated email includes:

### HTML Version
- Professional AFREQ branding
- Clear credentials display
- Security warnings
- Step-by-step login instructions
- Call-to-action button
- Footer with company information

### Plain Text Version
- Same information in text format
- For email clients that don't support HTML

## Security Considerations

1. **Temporary Passwords**: All passwords are temporary and must be changed on first login
2. **HTTPS Required**: Email links should use HTTPS in production
3. **Password Display**: Passwords are shown in the browser modal as a fallback but should be copied securely
4. **Email Delivery**: Monitor email delivery rates to ensure customers receive credentials

## Troubleshooting

### Email Not Sending

Check browser console for error messages:
- `EMAIL SERVICE NOT CONFIGURED` - No email service configured, see setup instructions above
- `API email sending failed` - Backend endpoint not available or returning errors
- `EmailJS sending failed` - Check EmailJS credentials and quota

### EmailJS Quota Exceeded

Free EmailJS accounts have a 300 emails/month limit:
- Upgrade to paid plan for more emails
- Switch to backend API method
- Use Airtable automations

### Wrong Email Template

Verify EmailJS template variables match exactly:
- `to_email`, `to_name`, `customer_email`, `temporary_password`, `login_url`

## Environment Variables Summary

Add these to `frontend/.env` (optional, only if using EmailJS):

```env
# EmailJS Configuration (Optional)
VITE_EMAIL_SERVICE_ID=service_xxxxxxx
VITE_EMAIL_TEMPLATE_ID=template_xxxxxxx
VITE_EMAIL_PUBLIC_KEY=xxxxxxxxxxxxxxxx
```

## Code Location

Email service implementation:
- Service: `frontend/src/services/email.ts`
- Integration: `frontend/src/components/ghana-team/ItemDetailsModal.tsx` (line 341-357)
- Config: `frontend/src/config/env.ts`

## Future Enhancements

Possible improvements:
- Email verification for new customers
- Password reset emails
- Shipment notification emails
- Invoice emails
- Support request confirmation emails
