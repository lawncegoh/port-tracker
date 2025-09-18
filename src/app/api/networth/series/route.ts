import { NextRequest, NextResponse } from 'next/server';
import { getServerRepo as getRepo } from '@/lib/repo/server';
import {
  Position,
  RealEstateProperty,
  OtherAsset,
  Liability,
} from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const repo = await getRepo();
    
    // Get all data sources
    const positions = await repo.listPositions();
    const properties = await repo.listProperties();
    const assets = await repo.listAssets();
    const liabilities = await repo.listLiabilities();
    const snapshots = await repo.listSnapshots(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    
    // Calculate current net worth
    const brokerageValue = positions.reduce(
      (sum: number, pos: Position) => sum + pos.marketValue,
      0
    );
    const realEstateEquity = properties.reduce(
      (sum: number, prop: RealEstateProperty) =>
        sum + (prop.currentValue - prop.loanPrincipal),
      0
    );
    const otherAssetsValue = assets.reduce(
      (sum: number, asset: OtherAsset) => sum + asset.value,
      0
    );
    const totalLiabilities = liabilities.reduce(
      (sum: number, liab: Liability) => sum + liab.balance,
      0
    );
    
    const currentNetWorth = brokerageValue + realEstateEquity + otherAssetsValue - totalLiabilities;
    
    // Generate time series data (last 12 months for demo)
    const timeSeries = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Simulate some variation in net worth over time
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const monthNetWorth = currentNetWorth * (1 + variation);
      
      timeSeries.push({
        month: monthName,
        date: date.toISOString(),
        netWorth: Math.round(monthNetWorth),
        breakdown: {
          brokerage: Math.round(brokerageValue * (1 + variation * 0.8)),
          realEstate: Math.round(realEstateEquity * (1 + variation * 0.3)),
          otherAssets: Math.round(otherAssetsValue * (1 + variation * 0.6)),
          liabilities: Math.round(totalLiabilities * (1 + variation * 0.2))
        }
      });
    }
    
    const response = {
      currentNetWorth,
      currentBreakdown: {
        brokerage: brokerageValue,
        realEstate: realEstateEquity,
        otherAssets: otherAssetsValue,
        liabilities: totalLiabilities
      },
      timeSeries,
      summary: {
        totalAssets: brokerageValue + realEstateEquity + otherAssetsValue,
        totalLiabilities,
        assetAllocation: {
          brokerage: brokerageValue / (brokerageValue + realEstateEquity + otherAssetsValue) * 100,
          realEstate: realEstateEquity / (brokerageValue + realEstateEquity + otherAssetsValue) * 100,
          otherAssets: otherAssetsValue / (brokerageValue + realEstateEquity + otherAssetsValue) * 100
        }
      },
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error calculating net worth series:', error);
    
    return NextResponse.json({
      error: 'Failed to calculate net worth series',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const repo = await getRepo();
    
    // Create a new snapshot
    const positions = await repo.listPositions();
    const properties = await repo.listProperties();
    const assets = await repo.listAssets();
    const liabilities = await repo.listLiabilities();
    
    const brokerageValue = positions.reduce(
      (sum: number, pos: Position) => sum + pos.marketValue,
      0
    );
    const realEstateEquity = properties.reduce(
      (sum: number, prop: RealEstateProperty) =>
        sum + (prop.currentValue - prop.loanPrincipal),
      0
    );
    const otherAssetsValue = assets.reduce(
      (sum: number, asset: OtherAsset) => sum + asset.value,
      0
    );
    const totalLiabilities = liabilities.reduce(
      (sum: number, liab: Liability) => sum + liab.balance,
      0
    );
    
    const snapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: new Date(),
      totalAssets: brokerageValue + realEstateEquity + otherAssetsValue,
      totalLiabilities,
      netWorth: brokerageValue + realEstateEquity + otherAssetsValue - totalLiabilities,
      breakdown: {
        brokerage: brokerageValue,
        realEstate: realEstateEquity,
        otherAssets: otherAssetsValue,
        liabilities: totalLiabilities
      }
    };
    
    await repo.saveSnapshot(snapshot);
    
    return NextResponse.json({
      message: 'Net worth snapshot created',
      snapshot,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating net worth snapshot:', error);
    
    return NextResponse.json({
      error: 'Failed to create net worth snapshot',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}





