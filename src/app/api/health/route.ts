import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple health check - could be expanded to check database, external APIs, etc.
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'SpeakChat.ai'
    });
  } catch {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
