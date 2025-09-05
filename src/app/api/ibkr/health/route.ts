import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return a mock connected status since we're implementing manual sync
    // In a real implementation, this would check if IBKR Gateway is accessible
    return NextResponse.json({
      status: 'connected',
      timestamp: new Date().toISOString(),
      gateway: 'IBKR Gateway',
      version: '1.0',
      lastSync: null // Will be populated when sync is performed
    });
  } catch (error) {
    console.error('IBKR Gateway connection error:', error);
    
    return NextResponse.json({
      status: 'disconnected',
      message: 'Unable to connect to IBKR Gateway',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'sync') {
      // Simulate sync operation
      // In real implementation, this would trigger IBKR data import
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2 second sync
      
      return NextResponse.json({
        status: 'success',
        message: 'IBKR data sync completed',
        lastSync: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      status: 'error',
      message: 'Invalid action',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  } catch (error) {
    console.error('IBKR sync error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to sync IBKR data',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
