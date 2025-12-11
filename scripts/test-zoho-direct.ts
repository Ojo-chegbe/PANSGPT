import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Direct test to see if we can authenticate with Zoho
 * This bypasses our email service to test raw SMTP connection
 */
async function testDirectConnection() {
  const email = process.env.ZOHO_EMAIL?.trim();
  const password = process.env.ZOHO_PASSWORD?.trim();

  console.log('Direct Zoho SMTP Connection Test\n');
  console.log('='.repeat(50));
  console.log('Email:', email);
  console.log('Password length:', password?.length || 0);
  console.log('='.repeat(50));
  console.log('');

  if (!email || !password) {
    console.error('❌ Missing credentials');
    process.exit(1);
  }

  // Test 1: Port 465 with SSL (most common for Zoho)
  console.log('Test 1: Port 465 (SSL)');
  console.log('-'.repeat(50));
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: email,
        pass: password,
      },
      debug: true, // Enable debug output
      logger: true, // Log to console
    });

    console.log('Attempting to verify connection...');
    const verified = await transporter.verify();
    console.log('✅ Connection verified!');
    console.log('✅ Authentication successful!\n');
    
    // Try sending a test email
    console.log('Sending test email to:', email);
    const info = await transporter.sendMail({
      from: `"PansGPT Test" <${email}>`,
      to: email,
      subject: 'Zoho SMTP Test - SUCCESS',
      text: 'If you receive this, Zoho SMTP is working correctly!',
      html: '<p>If you receive this, Zoho SMTP is working correctly!</p>',
    });
    
    console.log('✅ Test email sent!');
    console.log('Message ID:', info.messageId);
    console.log('\n🎉 SUCCESS! Your Zoho SMTP is configured correctly.');
    console.log('The issue might be in how the email service is being called.');
    process.exit(0);
    
  } catch (error: any) {
    console.log('❌ Failed');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    console.log('Response:', error.response);
    console.log('');
    
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.log('🔍 Authentication Failed - Possible causes:');
      console.log('   1. Wrong email address');
      console.log('   2. Wrong app password');
      console.log('   3. App password expired or revoked');
      console.log('   4. Using regular password instead of app password');
      console.log('   5. Email account not properly set up in Zoho');
      console.log('   6. Two-factor authentication not enabled');
      console.log('');
      console.log('💡 Next steps:');
      console.log('   - Log into Zoho Mail: https://mail.zoho.com');
      console.log('   - Go to Settings → Security → App Passwords');
      console.log('   - Generate a NEW app password');
      console.log('   - Make sure you select the correct email account');
      console.log('   - Copy the password immediately (you can only see it once)');
      console.log('   - Update your .env file with the new password');
    }
  }

  process.exit(1);
}

testDirectConnection().catch(console.error);

