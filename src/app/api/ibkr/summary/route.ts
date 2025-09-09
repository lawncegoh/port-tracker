import { NextRequest, NextResponse } from 'next/server';
import { getRepo } from '@/lib/repo/factory';
import { Position } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const repo = await getRepo();
    const positions = await repo.listPositions();
    const trades = await repo.listTrades();
    
    // Calculate summary from positions and trades
    const totalMarketValue = positions.reduce(
      (sum: number, pos: Position) => sum + pos.marketValue,
      0
    );
    const totalUnrealizedPnL = positions.reduce(
      (sum: number, pos: Position) => sum + pos.unrealizedPnL,
      0
    );
    const totalRealizedPnL = positions.reduce(
      (sum: number, pos: Position) => sum + pos.realizedPnL,
      0
    );
    
    // Mock cash balance - in real implementation this would come from IBKR
    const cashBalance = 25000;
    const nav = totalMarketValue + cashBalance;
    
    const summary = {
      netAssetValue: nav,
      cashBalance,
      totalMarketValue,
      totalUnrealizedPnL,
      totalRealizedPnL,
      totalPnL: totalUnrealizedPnL + totalRealizedPnL,
      positions: positions.length,
      accounts: ['IBKR-001', 'IBKR-002'], // Mock accounts
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch summary',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

