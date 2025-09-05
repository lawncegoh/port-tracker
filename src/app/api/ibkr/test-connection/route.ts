import { NextRequest, NextResponse } from 'next/server';
import { IBKRFlexWebService } from '@/lib/ibkr/flex-web-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flexToken, flexQueryId } = body;

    if (!flexToken || !flexQueryId) {
      return NextResponse.json({
        error: 'Missing credentials',
        message: 'Both Flex Token and Activity Flex Query ID are required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Create IBKR Flex Web Service client
    const ibkrService = new IBKRFlexWebService({
      accessToken: flexToken,
      queryId: flexQueryId
    });

    // Test the connection by attempting to generate a report
    const testResult = await ibkrService.testConnection();
    
    if (testResult.status === 'success') {
      return NextResponse.json({
        status: 'success',
        message: 'IBKR Flex Web Service connection successful',
        details: {
          flexQueryId,
          connectionType: 'Flex Web Service',
          permissions: 'Read-Only',
          lastTested: new Date().toISOString(),
          serviceUrl: 'https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'IBKR Flex Web Service connection failed',
        error: testResult.message || 'Unknown connection error',
        details: {
          flexQueryId,
          connectionType: 'Flex Web Service',
          lastTested: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }
  } catch (error) {
    console.error('IBKR connection test error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to test IBKR connection',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
