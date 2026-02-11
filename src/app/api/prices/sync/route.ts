import { NextResponse } from 'next/server';
import { syncAndCompute } from '@/lib/finance/sync';
import { seedDatabase } from '@/lib/seed';

export async function POST() {
  try {
    await seedDatabase();
    await syncAndCompute();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      { error: 'Failed to sync prices' },
      { status: 500 }
    );
  }
}
