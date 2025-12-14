// Script to fix corrupted level values in the database
// Run with: npx ts-node scripts/fix-levels.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLevels() {
    try {
        // First, let's see what level values exist
        const users = await prisma.user.findMany({
            select: { id: true, email: true, level: true }
        });

        console.log('Current user levels:');
        users.forEach(user => {
            console.log(`  ${user.email}: "${user.level}"`);
        });

        // Fix any corrupted levels (e.g., "400 Level Level" -> "400 Level")
        for (const user of users) {
            if (user.level && user.level.includes('Level Level')) {
                const fixedLevel = user.level.replace(' Level Level', ' Level');
                console.log(`\nFixing ${user.email}: "${user.level}" -> "${fixedLevel}"`);

                await prisma.user.update({
                    where: { id: user.id },
                    data: { level: fixedLevel }
                });
            }
        }

        // Also check timetable entries
        const timetables = await prisma.timetable.findMany({
            select: { id: true, level: true, courseCode: true }
        });

        console.log('\nCurrent timetable levels:');
        const uniqueLevels = [...new Set(timetables.map(t => t.level))];
        uniqueLevels.forEach(level => {
            console.log(`  "${level}"`);
        });

        // Fix any corrupted timetable levels
        for (const entry of timetables) {
            if (entry.level && entry.level.includes('Level Level')) {
                const fixedLevel = entry.level.replace(' Level Level', ' Level');
                console.log(`\nFixing timetable ${entry.courseCode}: "${entry.level}" -> "${fixedLevel}"`);

                await prisma.timetable.update({
                    where: { id: entry.id },
                    data: { level: fixedLevel }
                });
            }
        }

        console.log('\nDone! Levels have been fixed.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixLevels();
