import { NextResponse } from 'next/server';
import { startUptimeMonitoring } from '@/lib/uptime-monitor';

export async function POST() {
  try {
    startUptimeMonitoring();
    return NextResponse.json({ 
      success: true, 
      message: 'Uptime monitoring started' 
    });
  } catch (error) {
    console.error('Failed to start uptime monitoring:', error);
    return NextResponse.json(
      { error: 'Failed to start uptime monitoring' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Uptime monitoring endpoint - use POST to start' 
  });
}
