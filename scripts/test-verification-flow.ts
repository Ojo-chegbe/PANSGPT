/**
 * Test script to check the verification flow
 * Usage: npx tsx scripts/test-verification-flow.ts <email>
 */
import { prisma } from "../src/lib/prisma";

async function testVerificationFlow(email: string) {
  try {
    console.log(`\n🔍 Testing verification flow for: ${email}\n`);

    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerified: true }
    });

    if (user) {
      console.log('✅ User exists in User table:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Verified Date: ${user.emailVerified || 'NOT VERIFIED'}`);
      return;
    }

    // 2. Check if pending signup exists
    const pendingSignup = await prisma.pendingSignup.findUnique({
      where: { email }
    });

    if (!pendingSignup) {
      console.log('❌ No pending signup found');
      console.log('   This email has not signed up yet.');
      return;
    }

    console.log('📋 Pending signup found:');
    console.log(`   ID: ${pendingSignup.id}`);
    console.log(`   Email: ${pendingSignup.email}`);
    console.log(`   Name: ${pendingSignup.name}`);
    console.log(`   Token (first 16 chars): ${pendingSignup.verificationToken.substring(0, 16)}...`);
    console.log(`   Token expires: ${pendingSignup.verificationTokenExpires}`);
    
    const now = new Date();
    const isExpired = pendingSignup.verificationTokenExpires < now;
    
    console.log(`\n⏰ Token status:`);
    console.log(`   Current time: ${now.toISOString()}`);
    console.log(`   Expires: ${pendingSignup.verificationTokenExpires.toISOString()}`);
    console.log(`   Is expired: ${isExpired ? 'YES ❌' : 'NO ✅'}`);
    
    if (isExpired) {
      console.log('\n⚠️  Token has expired! User needs to request a new verification email.');
    } else {
      const timeLeft = pendingSignup.verificationTokenExpires.getTime() - now.getTime();
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      console.log(`   Time remaining: ${hoursLeft}h ${minutesLeft}m`);
      console.log(`\n🔗 Verification URL:`);
      const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      console.log(`   ${appUrl}/verify-email?token=${pendingSignup.verificationToken}`);
      
      // Test the query that the API uses
      console.log(`\n🧪 Testing API query...`);
      const testQuery = await prisma.pendingSignup.findFirst({
        where: {
          verificationToken: pendingSignup.verificationToken,
          verificationTokenExpires: {
            gt: new Date()
          }
        }
      });
      
      if (testQuery) {
        console.log('✅ API query would find this pending signup');
      } else {
        console.log('❌ API query would NOT find this pending signup');
        console.log('   This might be because the token is expired or there\'s a mismatch');
      }
    }

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
  console.error('Usage: npx tsx scripts/test-verification-flow.ts <email>');
  process.exit(1);
}

testVerificationFlow(email);
