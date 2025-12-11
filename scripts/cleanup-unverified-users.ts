import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupUnverifiedUsers() {
  try {
    console.log('Checking for unverified users...');
    
    // Find all users where emailVerified is null
    const unverifiedUsers = await prisma.user.findMany({
      where: {
        emailVerified: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    console.log(`Found ${unverifiedUsers.length} unverified user(s):`);
    unverifiedUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Created: ${user.createdAt}`);
    });

    if (unverifiedUsers.length === 0) {
      console.log('No unverified users found. Database is clean!');
      return;
    }

    // Delete users one by one to handle foreign key constraints
    // Prisma will cascade delete related records based on schema
    let deletedCount = 0;
    let errorCount = 0;

    for (const user of unverifiedUsers) {
      try {
        // Delete related records first
        // Delete subscriptions
        await prisma.subscription.deleteMany({
          where: { userId: user.id }
        });

        // Delete document access
        await prisma.documentAccess.deleteMany({
          where: { userId: user.id }
        });

        // Delete password reset tokens
        await prisma.passwordResetToken.deleteMany({
          where: { userId: user.id }
        });

        // Delete sessions
        await prisma.session.deleteMany({
          where: { userId: user.id }
        });

        // Delete accounts
        await prisma.account.deleteMany({
          where: { userId: user.id }
        });

        // Delete message feedbacks
        await prisma.messageFeedback.deleteMany({
          where: { userId: user.id }
        });

        // Delete quiz results
        await prisma.quizResult.deleteMany({
          where: { userId: user.id }
        });

        // Delete quizzes
        await prisma.quiz.deleteMany({
          where: { userId: user.id }
        });

        // Delete conversations (this will cascade delete messages)
        await prisma.conversation.deleteMany({
          where: { userId: user.id }
        });

        // Now delete the user
        await prisma.user.delete({
          where: { id: user.id }
        });
        console.log(`✓ Deleted: ${user.email}`);
        deletedCount++;
      } catch (error: any) {
        console.error(`✗ Failed to delete ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\nSummary:`);
    console.log(`  Successfully deleted: ${deletedCount} user(s)`);
    if (errorCount > 0) {
      console.log(`  Failed to delete: ${errorCount} user(s)`);
    }
    
  } catch (error) {
    console.error('Error cleaning up unverified users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUnverifiedUsers()
  .then(() => {
    console.log('\nCleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nCleanup failed:', error);
    process.exit(1);
  });

