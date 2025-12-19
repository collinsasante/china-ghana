import axios from 'axios';
import { config } from '../config/env';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface CustomerCredentialsEmail {
  customerName: string;
  customerEmail: string;
  temporaryPassword: string;
}

/**
 * Send customer credentials email
 * This function sends login credentials to a newly created customer
 *
 * NOTE: The recommended approach is to use Airtable Automation instead of this function.
 * See AIRTABLE_AUTOMATION_EMAIL_SETUP.md for setup instructions.
 *
 * This function is provided as a fallback or alternative method if you prefer
 * to use EmailJS or a backend API instead of Airtable automations.
 */
export async function sendCustomerCredentialsEmail(data: CustomerCredentialsEmail): Promise<boolean> {
  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #009EF7;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f8f9fa;
      padding: 30px;
      border: 1px solid #e4e6ef;
      border-radius: 0 0 5px 5px;
    }
    .credentials-box {
      background-color: #fff3cd;
      border: 2px solid #ffc107;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .password {
      font-size: 24px;
      font-weight: bold;
      color: #d63384;
      letter-spacing: 2px;
      text-align: center;
      padding: 15px;
      background-color: white;
      border-radius: 5px;
      margin: 10px 0;
    }
    .button {
      display: inline-block;
      background-color: #009EF7;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e4e6ef;
      color: #7e8299;
      font-size: 12px;
    }
    .warning {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>AFREQ Logistics</h1>
    <p>Welcome to Your Account</p>
  </div>

  <div class="content">
    <h2>Hello ${data.customerName},</h2>

    <p>Welcome to AFREQ Logistics! Your customer account has been created successfully.</p>

    <p>You can now track your shipments, view item details, and manage your deliveries through our online platform.</p>

    <div class="credentials-box">
      <h3 style="margin-top: 0;">Your Login Credentials</h3>

      <p><strong>Email:</strong> ${data.customerEmail}</p>

      <p><strong>Temporary Password:</strong></p>
      <div class="password">${data.temporaryPassword}</div>
    </div>

    <div class="warning">
      <strong>⚠️ Important Security Notice:</strong>
      <ul style="margin: 10px 0;">
        <li>This is a temporary password</li>
        <li>You will be required to change it on your first login</li>
        <li>Do not share this password with anyone</li>
        <li>If you didn't request this account, please contact us immediately</li>
      </ul>
    </div>

    <p style="text-align: center;">
      <a href="${window.location.origin}/login" class="button">Login to Your Account</a>
    </p>

    <h3>What's Next?</h3>
    <ol>
      <li>Click the "Login to Your Account" button above</li>
      <li>Enter your email and temporary password</li>
      <li>Create a new secure password when prompted</li>
      <li>Complete your profile information</li>
      <li>Start tracking your shipments!</li>
    </ol>

    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

    <p>Best regards,<br>
    <strong>AFREQ Logistics Team</strong></p>
  </div>

  <div class="footer">
    <p>This is an automated email from AFREQ Logistics. Please do not reply to this email.</p>
    <p>If you need help, please contact our support team.</p>
    <p>&copy; ${new Date().getFullYear()} AFREQ Logistics. All rights reserved.</p>
  </div>
</body>
</html>
`;

    const emailText = `
Welcome to AFREQ Logistics!

Hello ${data.customerName},

Your customer account has been created successfully. Here are your login credentials:

Email: ${data.customerEmail}
Temporary Password: ${data.temporaryPassword}

IMPORTANT: You will be required to change this password on your first login.

Login URL: ${window.location.origin}/login

Next Steps:
1. Visit the login page
2. Enter your email and temporary password
3. Create a new secure password when prompted
4. Complete your profile information
5. Start tracking your shipments!

Best regards,
AFREQ Logistics Team
`;

    // Try to send email via backend API endpoint (if available)
    try {
      const response = await axios.post('/api/send-email', {
        to: data.customerEmail,
        subject: 'Your AFREQ Logistics Account - Login Credentials',
        html: emailHtml,
        text: emailText,
      });

      if (response.status === 200) {
        console.log('Email sent successfully via API');
        return true;
      }
    } catch (apiError: any) {
      console.warn('API email sending failed, trying alternative method:', apiError.message);

      // If backend API fails or doesn't exist, try EmailJS or Resend
      // Check if we have email service configured
      if (config.email?.serviceId && config.email?.templateId && config.email?.publicKey) {
        try {
          // Using EmailJS
          const emailJsResponse = await axios.post(
            'https://api.emailjs.com/api/v1.0/email/send',
            {
              service_id: config.email.serviceId,
              template_id: config.email.templateId,
              user_id: config.email.publicKey,
              template_params: {
                to_email: data.customerEmail,
                to_name: data.customerName,
                customer_email: data.customerEmail,
                temporary_password: data.temporaryPassword,
                login_url: `${window.location.origin}/login`,
              },
            }
          );

          if (emailJsResponse.status === 200) {
            console.log('Email sent successfully via EmailJS');
            return true;
          }
        } catch (emailJsError) {
          console.error('EmailJS sending failed:', emailJsError);
        }
      }

      // If email service is not configured, show console message with credentials
      console.warn('⚠️ EMAIL SERVICE NOT CONFIGURED');
      console.warn('📧 Customer credentials email would be sent to:', data.customerEmail);
      console.warn('📝 Email content:');
      console.warn('---');
      console.warn(`To: ${data.customerEmail}`);
      console.warn(`Subject: Your AFREQ Logistics Account - Login Credentials`);
      console.warn(`\nHello ${data.customerName},\n`);
      console.warn(`Email: ${data.customerEmail}`);
      console.warn(`Temporary Password: ${data.temporaryPassword}`);
      console.warn(`Login URL: ${window.location.origin}/login`);
      console.warn('---');
      console.warn('💡 To enable automatic emails, configure one of these options:');
      console.warn('   1. Set up a backend API endpoint at /api/send-email');
      console.warn('   2. Configure EmailJS with VITE_EMAIL_SERVICE_ID, VITE_EMAIL_TEMPLATE_ID, VITE_EMAIL_PUBLIC_KEY');
      console.warn('   3. Use Airtable Automations to send emails when new customers are created');

      // Return true to not block the flow, but email wasn't actually sent
      return false;
    }

    return false;
  } catch (error) {
    console.error('Error in sendCustomerCredentialsEmail:', error);
    return false;
  }
}

/**
 * Generic email sending function
 */
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Try backend API first
    const response = await axios.post('/api/send-email', emailData);
    return response.status === 200;
  } catch (error) {
    console.error('Error sending email:', error);
    console.warn('Email was not sent. Please configure email service.');
    return false;
  }
}
