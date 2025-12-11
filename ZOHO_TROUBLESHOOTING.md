# Zoho Email Authentication Troubleshooting

## Current Error: 535 Authentication Failed

This error means Zoho is rejecting your credentials. Here's how to fix it:

## Important: Localhost vs Production

**SMTP authentication should work from localhost** - the 535 error is a credential issue, not a domain restriction. However, some email providers have security settings that might block connections. The authentication happens at the SMTP server level and doesn't depend on your application's domain.

## Step 1: Verify App Password Generation

1. Log into Zoho Mail: https://mail.zoho.com
2. Go to **Settings** → **Security** → **App Passwords**
3. Make sure you're generating the app password for the **correct email account**
4. **Important**: Generate a NEW app password specifically for SMTP
5. Copy the password immediately (you can only see it once)

## Step 2: Check Which Email to Use

**CRITICAL**: For Zoho SMTP, you might need to use:
- The **main Zoho account email** (the one you use to log into Zoho)
- NOT the alias email (`no-reply@pansgpt.site`)

**Try this:**
1. Check what email you use to log into Zoho Mail
2. If it's different from `no-reply@pansgpt.site`, try using that email instead
3. Generate an app password for that main account email

## Step 3: Update .env File

Try using the main account email:

```env
# Option 1: If your main Zoho account is different
ZOHO_EMAIL=your-main-account@zoho.com
ZOHO_PASSWORD=your-app-password-here

# OR Option 2: If no-reply is your main account
ZOHO_EMAIL=no-reply@pansgpt.site
ZOHO_PASSWORD=regenerate-this-app-password
```

## Step 4: Test the Configuration

Run the test script:
```bash
npx tsx scripts/test-zoho-email.ts
```

## Step 5: Alternative - Use Zoho Mail API

If SMTP continues to fail, you might need to:
1. Enable "Less Secure Apps" in Zoho (if available)
2. Check Zoho Mail domain settings
3. Verify SMTP is enabled for your domain
4. Contact Zoho support if domain email aliases don't work with SMTP

## Common Issues

### Issue: "535 Authentication Failed"
**Solution**: 
- Regenerate app password
- Use main account email, not alias
- Ensure 2FA is enabled

### Issue: "Connection timeout"
**Solution**: 
- Check firewall settings
- Try port 587 instead of 465
- Verify internet connection

### Issue: "Domain not verified"
**Solution**: 
- Verify domain in Zoho Mail admin panel
- Check DNS settings
- Wait for DNS propagation

## Quick Test

After updating credentials, restart your server and try signing up again. Check the console logs for detailed error messages.

