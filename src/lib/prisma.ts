import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Debug: Log environment variables to verify correct database URL
console.log('🔍 Environment Variables Debug:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DIRECT_URL:', process.env.DIRECT_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

export const prisma = global.prisma || new PrismaClient({
  log: ['query'],
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma 