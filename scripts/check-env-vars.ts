import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Environment Variables Check:\n');
console.log('ZOHO_EMAIL:', process.env.ZOHO_EMAIL || 'NOT SET');
console.log('ZOHO_EMAIL length:', process.env.ZOHO_EMAIL?.length || 0);
console.log('ZOHO_EMAIL (with quotes):', `"${process.env.ZOHO_EMAIL || ''}"`);
console.log('ZOHO_EMAIL has spaces:', process.env.ZOHO_EMAIL?.includes(' ') ? 'YES ❌' : 'NO ✓');
console.log('');

console.log('ZOHO_PASSWORD:', process.env.ZOHO_PASSWORD ? 'SET' : 'NOT SET');
console.log('ZOHO_PASSWORD length:', process.env.ZOHO_PASSWORD?.length || 0);
console.log('ZOHO_PASSWORD (first 3):', process.env.ZOHO_PASSWORD ? process.env.ZOHO_PASSWORD.substring(0, 3) + '...' : 'N/A');
console.log('ZOHO_PASSWORD has spaces:', process.env.ZOHO_PASSWORD?.includes(' ') ? 'YES ❌' : 'NO ✓');
console.log('ZOHO_PASSWORD trimmed length:', process.env.ZOHO_PASSWORD?.trim().length || 0);
console.log('');

console.log('ZOHO_SMTP_PORT:', process.env.ZOHO_SMTP_PORT || 'NOT SET (defaults to 465)');
console.log('');

// Check for common issues
const issues: string[] = [];
if (!process.env.ZOHO_EMAIL) issues.push('ZOHO_EMAIL is not set');
if (!process.env.ZOHO_PASSWORD) issues.push('ZOHO_PASSWORD is not set');
if (process.env.ZOHO_EMAIL?.includes(' ')) issues.push('ZOHO_EMAIL contains spaces');
if (process.env.ZOHO_PASSWORD?.includes(' ')) issues.push('ZOHO_PASSWORD contains spaces');
if (process.env.ZOHO_PASSWORD && process.env.ZOHO_PASSWORD.length !== process.env.ZOHO_PASSWORD.trim().length) {
  issues.push('ZOHO_PASSWORD has leading/trailing spaces');
}

if (issues.length > 0) {
  console.log('❌ Issues found:');
  issues.forEach(issue => console.log('  -', issue));
} else {
  console.log('✓ No obvious formatting issues found');
  console.log('\n⚠️  If authentication still fails, the issue is likely:');
  console.log('  1. Wrong app password (regenerate in Zoho Mail settings)');
  console.log('  2. Need to use the main Zoho account email, not alias');
  console.log('  3. App password not properly generated');
}

