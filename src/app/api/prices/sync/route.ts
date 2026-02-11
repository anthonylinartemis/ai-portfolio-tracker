import { NextResponse } from 'next/server';
import { syncAndCompute } from '@/lib/finance/sync';
import { seedDatabase } from '@/lib/seed';

async function sync() {
  await seedDatabase();
  await syncAndCompute();
  return NextResponse.json({ success: true });
}

export async function POST() {
  try {
    return await sync();
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      { error: 'Failed to sync prices' },
      { status: 500 }
    );
  }
}

// GET handler for Vercel cron jobs
export async function GET() {
  try {
    return await sync();
  } catch (error) {
    console.error('Cron sync failed:', error);
    return NextResponse.json(
      { error: 'Failed to sync prices' },
      { status: 500 }
    );
  }
}
