import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testZohoEmail() {
  const email = process.env.ZOHO_EMAIL;
  const password = process.env.ZOHO_PASSWORD;

  console.log('Testing Zoho Email Configuration...\n');
  console.log('Email:', email);
  console.log('Password length:', password?.length || 0);
  console.log('Password (first 3 chars):', password ? password.substring(0, 3) + '...' : 'NOT SET');
  console.log('');

  if (!email || !password) {
    console.error('❌ ZOHO_EMAIL or ZOHO_PASSWORD not set in .env');
    process.exit(1);
  }

  // Test configuration 1: Port 465 with SSL
  console.log('Testing Configuration 1: Port 465 (SSL)...');
  try {
    const transporter1 = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
        user: email.trim(),
        pass: password.trim(),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter1.verify();
    console.log('✅ Port 465 (SSL) - SUCCESS!\n');
    
    // Try sending a test email
    console.log('Sending test email...');
    const info = await transporter1.sendMail({
      from: email,
      to: email, // Send to self
      subject: 'Test Email from PansGPT',
      text: 'This is a test email to verify Zoho SMTP configuration.',
      html: '<p>This is a test email to verify Zoho SMTP configuration.</p>',
    });
    console.log('✅ Test email sent successfully! Message ID:', info.messageId);
    process.exit(0);
  } catch (error: any) {
    console.log('❌ Port 465 (SSL) - FAILED:', error.message);
    console.log('Error code:', error.code);
    console.log('Response:', error.response);
    console.log('');
  }

  // Test configuration 2: Port 587 with TLS
  console.log('Testing Configuration 2: Port 587 (TLS)...');
  try {
    const transporter2 = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: email.trim(),
        pass: password.trim(),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter2.verify();
    console.log('✅ Port 587 (TLS) - SUCCESS!\n');
    
    // Try sending a test email
    console.log('Sending test email...');
    const info = await transporter2.sendMail({
      from: email,
      to: email, // Send to self
      subject: 'Test Email from PansGPT',
      text: 'This is a test email to verify Zoho SMTP configuration.',
      html: '<p>This is a test email to verify Zoho SMTP configuration.</p>',
    });
    console.log('✅ Test email sent successfully! Message ID:', info.messageId);
    console.log('\n💡 Update your .env: ZOHO_SMTP_PORT=587');
    process.exit(0);
  } catch (error: any) {
    console.log('❌ Port 587 (TLS) - FAILED:', error.message);
    console.log('Error code:', error.code);
    console.log('Response:', error.response);
    console.log('');
  }

  // Test configuration 3: Port 465 without TLS rejectUnauthorized
  console.log('Testing Configuration 3: Port 465 (SSL, strict TLS)...');
  try {
    const transporter3 = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
        user: email.trim(),
        pass: password.trim(),
      },
    });

    await transporter3.verify();
    console.log('✅ Port 465 (SSL, strict) - SUCCESS!\n');
    process.exit(0);
  } catch (error: any) {
    console.log('❌ Port 465 (SSL, strict) - FAILED:', error.message);
    console.log('');
  }

  console.log('❌ All configurations failed. Please check:');
  console.log('1. Email address is correct:', email);
  console.log('2. Password is an app-specific password (not regular password)');
  console.log('3. App password was generated in Zoho Mail settings');
  console.log('4. Two-factor authentication is enabled');
  console.log('5. No extra spaces in .env file');
  process.exit(1);
}

testZohoEmail().catch(console.error);

