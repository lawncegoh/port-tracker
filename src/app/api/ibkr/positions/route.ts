import { NextRequest, NextResponse } from 'next/server';
import { getRepo } from '@/lib/repo/factory';

export async function GET(request: NextRequest) {
  try {
    const repo = await getRepo();
    const positions = await repo.listPositions();
    
    return NextResponse.json({
      positions,
      count: positions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch positions',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repo = await getRepo();
    
    // In a real implementation, this would sync from IBKR Gateway
    // For now, just return success
    return NextResponse.json({
      message: 'Positions sync initiated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error syncing positions:', error);
    
    return NextResponse.json({
      error: 'Failed to sync positions',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
