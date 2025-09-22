import { NextResponse } from 'next/server';
import { stopUptimeMonitoring } from '@/lib/uptime-monitor';

export async function POST() {
  try {
    stopUptimeMonitoring();
    return NextResponse.json({ 
      success: true, 
      message: 'Uptime monitoring stopped' 
    });
  } catch (error) {
    console.error('Failed to stop uptime monitoring:', error);
    return NextResponse.json(
      { error: 'Failed to stop uptime monitoring' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Uptime monitoring stop endpoint - use POST to stop' 
  });
}
