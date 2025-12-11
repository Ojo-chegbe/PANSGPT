# Zoho Email Configuration Guide

## Environment Variables

Add these to your `.env` file:

```env
# No-Reply Account (for system notifications: verification emails, password resets)
ZOHO_EMAIL=no-reply@pansgpt.site
ZOHO_PASSWORD=kjfH7DwwB6Hk

# Updates Account (for welcome emails from "The Founders")
ZOHO_UPDATES_EMAIL=updates@pansgpt.site
ZOHO_UPDATES_PASSWORD=hmCyaXvdd04a

# SMTP Configuration (optional - defaults to 465 with SSL)
ZOHO_SMTP_PORT=465
```

## Email Configuration Details

### SMTP Settings
- **Host:** `smtp.zoho.com`
- **Port:** `465` (SSL) - default
- **Security:** SSL enabled

### Email Addresses Used

1. **no-reply@pansgpt.site**
   - Used for: Verification emails, password reset emails
   - Authentication: Uses `ZOHO_EMAIL` and `ZOHO_PASSWORD`

2. **updates@pansgpt.site**
   - Used for: Welcome emails to new signups
   - Authentication: Uses `ZOHO_UPDATES_EMAIL` and `ZOHO_UPDATES_PASSWORD`
   - Display Name: "The Founders"
   - Reply-To: `hello@pansgpt.site`

3. **support@pansgpt.site**
   - Used for: Feedback notifications (internal)

4. **hello@pansgpt.site**
   - Used for: Reply-To address (forwards to co-founders)

## Testing

After setting up the environment variables, test the email functionality:

1. **Welcome Email:** Create a new account - should receive welcome email from "The Founders"
2. **Verification:** Request a new verification email - should come from `no-reply@pansgpt.site`
3. **Password Reset:** Request a password reset - should come from `no-reply@pansgpt.site`

## Important Notes

- **CRITICAL**: Use **app-specific passwords**, not regular login passwords
  - Go to Zoho Mail → Settings → Security → App Passwords
  - Generate a new app password for each email account
  - Use these app passwords in your .env file, NOT your regular login password
- The welcome email uses `updates@pansgpt.site` for authentication
- All system notifications use `no-reply@pansgpt.site` for authentication
- The "From" display name for welcome emails is automatically set to "The Founders"
- Replies to welcome emails go to `hello@pansgpt.site` (which forwards to co-founders)

## Troubleshooting Authentication Errors

If you see "535 Authentication Failed" error:

1. **Verify you're using app passwords**: Regular passwords won't work with SMTP
2. **Check for extra spaces**: Make sure there are no spaces before/after passwords in .env
3. **Verify email addresses**: Ensure they match exactly (case-sensitive)
4. **Check port**: Should be 465 for SSL (default) or 587 for TLS
5. **Restart server**: After changing .env, restart your development server
6. **Check Zoho Mail settings**: Ensure SMTP is enabled for your domain

