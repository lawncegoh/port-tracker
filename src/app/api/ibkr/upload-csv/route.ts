import { NextRequest, NextResponse } from 'next/server';
import { IBKRCSVParser } from '@/lib/ibkr/csv-parser';
import { getRepo } from '@/lib/repo/factory';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dataType = formData.get('dataType') as string; // 'positions', 'trades', or 'auto'
    
    if (!file) {
      return NextResponse.json({
        error: 'No file provided',
        message: 'Please upload a CSV file',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({
        error: 'Invalid file type',
        message: 'Please upload a CSV file',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Read the CSV content
    const csvContent = await file.text();
    
    if (!csvContent.trim()) {
      return NextResponse.json({
        error: 'Empty file',
        message: 'The uploaded CSV file is empty',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Parse the CSV
    const parser = new IBKRCSVParser({
      includeHeaders: true,
      dateFormat: 'yyyy-MM-dd',
      timeFormat: 'HH:mm:ss'
    });

    const parsedRows = parser.parseCSV(csvContent);
    
    if (parsedRows.length === 0) {
      return NextResponse.json({
        error: 'No data found',
        message: 'The CSV file contains no recognizable data',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Determine data type if auto-detection is requested
    let actualDataType = dataType;
    if (dataType === 'auto') {
      // Auto-detect based on content
      const hasTrades = parsedRows.some(row => row.side && row.timestamp);
      const hasPositions = parsedRows.some(row => row.symbol && row.quantity && !row.side);
      
      if (hasTrades && hasPositions) {
        actualDataType = 'mixed';
      } else if (hasTrades) {
        actualDataType = 'trades';
      } else if (hasPositions) {
        actualDataType = 'positions';
      } else {
        actualDataType = 'unknown';
      }
    }

    // Get repository instance
    const repo = getRepo();
    
    let result: any = {
      message: 'CSV processed successfully',
      dataType: actualDataType,
      rowsProcessed: parsedRows.length,
      timestamp: new Date().toISOString()
    };

    // Process data based on type
    if (actualDataType === 'positions' || actualDataType === 'mixed') {
      const positions = parser.convertToPositions(parsedRows);
      
      // Save positions to repository
      for (const position of positions) {
        await repo.savePosition(position);
      }
      
      result.positionsSaved = positions.length;
    }

    if (actualDataType === 'trades' || actualDataType === 'mixed') {
      const trades = parser.convertToTrades(parsedRows);
      
      // Save trades to repository
      for (const trade of trades) {
        await repo.saveTrade(trade);
      }
      
      result.tradesSaved = trades.length;
    }

    if (actualDataType === 'unknown') {
      // Try to save as generic data
      const positions = parser.convertToPositions(parsedRows);
      const trades = parser.convertToTrades(parsedRows);
      
      for (const position of positions) {
        await repo.savePosition(position);
      }
      
      for (const trade of trades) {
        await repo.saveTrade(trade);
      }
      
      result.positionsSaved = positions.length;
      result.tradesSaved = trades.length;
      result.note = 'Data auto-detected and saved as best possible';
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('CSV upload error:', error);
    
    return NextResponse.json({
      error: 'Failed to process CSV',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

