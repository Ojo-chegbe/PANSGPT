import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserStatus() {
  const email = 'ogwuojochegbeemmanuel@gmail.com';
  
  console.log('Checking user status for:', email);
  console.log('='.repeat(50));
  
  // Check User table
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (user) {
    console.log('✓ User found in User table');
    console.log('  - ID:', user.id);
    console.log('  - Name:', user.name);
    console.log('  - Email verified:', user.emailVerified ? 'YES ✓' : 'NO ✗');
    console.log('  - Has password:', user.password ? 'YES ✓' : 'NO ✗');
    console.log('  - Created at:', user.createdAt);
  } else {
    console.log('✗ User NOT found in User table');
  }
  
  console.log('');
  
  // Check PendingSignup table
  const pending = await prisma.pendingSignup.findUnique({
    where: { email }
  });
  
  if (pending) {
    console.log('✓ Pending signup found');
    console.log('  - Email:', pending.email);
    console.log('  - Name:', pending.name);
    console.log('  - Token expires:', pending.verificationTokenExpires);
    console.log('  - Is expired:', pending.verificationTokenExpires < new Date() ? 'YES ✗' : 'NO ✓');
    console.log('  - Created at:', pending.createdAt);
  } else {
    console.log('✗ No pending signup found');
  }
  
  await prisma.$disconnect();
}

checkUserStatus().catch(console.error);

