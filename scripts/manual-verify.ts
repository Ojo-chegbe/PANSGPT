/**
 * Manual verification script - verifies a pending signup directly
 * Usage: npx tsx scripts/manual-verify.ts <email>
 */
import { prisma } from "../src/lib/prisma";
import { sendWelcomeEmail } from "../src/lib/email-service";

async function manualVerify(email: string) {
  try {
    console.log(`\n🔍 Looking for pending signup: ${email}\n`);

    // Find pending signup
    const pendingSignup = await prisma.pendingSignup.findUnique({
      where: { email }
    });

    if (!pendingSignup) {
      console.error('❌ No pending signup found for this email');
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        console.log('✅ User already exists and is verified!');
        console.log(`   User ID: ${existingUser.id}`);
        console.log(`   Email Verified: ${existingUser.emailVerified}`);
      }
      return;
    }

    console.log('✅ Pending signup found:');
    console.log(`   ID: ${pendingSignup.id}`);
    console.log(`   Name: ${pendingSignup.name}`);
    console.log(`   Email: ${pendingSignup.email}`);
    console.log(`   Token expires: ${pendingSignup.verificationTokenExpires}`);
    console.log(`   Token (first 16 chars): ${pendingSignup.verificationToken.substring(0, 16)}...`);

    // Check if already expired
    if (pendingSignup.verificationTokenExpires < new Date()) {
      console.error('\n⚠️  Token has expired!');
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: pendingSignup.email }
    });

    if (existingUser) {
      console.log('\n⚠️  User already exists! Deleting pending signup...');
      await prisma.pendingSignup.delete({ where: { id: pendingSignup.id } });
      console.log('✅ Pending signup deleted');
      return;
    }

    // Create the user
    console.log('\n📝 Creating user account...');
    const user = await prisma.user.create({
      data: {
        email: pendingSignup.email,
        password: pendingSignup.password,
        name: pendingSignup.name,
        level: pendingSignup.level,
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpires: null
      }
    });

    console.log('✅ User created successfully!');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);

    // Delete pending signup
    console.log('\n🗑️  Deleting pending signup...');
    await prisma.pendingSignup.delete({ where: { id: pendingSignup.id } });
    console.log('✅ Pending signup deleted');

    // Send welcome email
    console.log('\n📧 Sending welcome email...');
    try {
      const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const result = await sendWelcomeEmail(
        user.name || 'there',
        user.email,
        `${appUrl}/login`
      );
      
      if (result.success) {
        console.log('✅ Welcome email sent successfully!');
      } else {
        console.error('❌ Failed to send welcome email:', result.error);
      }
    } catch (emailError: any) {
      console.error('❌ Error sending welcome email:', emailError.message);
    }

    console.log('\n🎉 Verification complete! User can now log in.\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx scripts/manual-verify.ts <email>');
  process.exit(1);
}

manualVerify(email);
