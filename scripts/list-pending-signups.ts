/**
 * List all pending signups
 */
import { prisma } from "../src/lib/prisma";

async function listPendingSignups() {
  try {
    const pendingSignups = await prisma.pendingSignup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (pendingSignups.length === 0) {
      console.log('\n✅ No pending signups found.\n');
      return;
    }

    console.log(`\n📋 Found ${pendingSignups.length} pending signup(s):\n`);
    
    pendingSignups.forEach((signup, index) => {
      const now = new Date();
      const isExpired = signup.verificationTokenExpires < now;
      const timeLeft = signup.verificationTokenExpires.getTime() - now.getTime();
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      
      console.log(`${index + 1}. Email: ${signup.email}`);
      console.log(`   Name: ${signup.name}`);
      console.log(`   Created: ${signup.createdAt.toISOString()}`);
      console.log(`   Expires: ${signup.verificationTokenExpires.toISOString()}`);
      console.log(`   Status: ${isExpired ? '❌ EXPIRED' : `✅ Valid (${hoursLeft}h left)`}`);
      console.log(`   Token: ${signup.verificationToken.substring(0, 16)}...`);
      console.log('');
    });

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

listPendingSignups();
