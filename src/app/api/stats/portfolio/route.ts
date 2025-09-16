import { NextRequest, NextResponse } from 'next/server';
import { getServerRepo as getRepo } from '@/lib/repo/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const repo = await getRepo();
    const stats = await repo.getPortfolioStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    
    return NextResponse.json({
      ...stats,
      timestamp: new Date().toISOString(),
      period: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio stats:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch portfolio stats',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}



