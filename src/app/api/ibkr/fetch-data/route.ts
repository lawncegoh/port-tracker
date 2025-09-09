import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import { IBKRCSVParser } from '@/lib/ibkr/csv-parser';
import { getRepo } from '@/lib/repo/factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      token,
      queryId,
      flexToken,
      flexQueryId,
      version = '3',
      dataType = 'auto',
    } = body as {
      token?: string | number;
      queryId?: string | number;
      flexToken?: string | number;
      flexQueryId?: string | number;
      version?: string | number;
      dataType?: 'auto' | 'positions' | 'trades';
    };

    const t = flexToken ?? token;
    const q = flexQueryId ?? queryId;

    if (!t || !q) {
      return NextResponse.json({ message: 'Missing token or queryId' }, { status: 400 });
    }

    // Step 1: request report generation
    const sendBase = 'https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService/SendRequest';
    const sendUrl = new URL(sendBase);
    sendUrl.search = new URLSearchParams({
      t: String(t),
      q: String(q),
      v: String(version ?? '3'),
    }).toString();

    const res = await fetch(sendUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
        'user-agent': 'port-tracker/1.0',
      },
    });

    const xml = await res.text();

    const parsed = await parseStringPromise(xml, { explicitArray: false, trim: true });
    const root = parsed?.FlexStatementResponse ?? {};
    const status: string | undefined = root?.Status;
    const referenceCode: string | undefined = root?.ReferenceCode;
    const errorMessage: string | undefined = root?.ErrorMessage;
    const timestamp: string | undefined = root?.$?.timestamp;

    if (status !== 'Success' || !referenceCode) {
      return NextResponse.json(
        { status: status ?? 'Fail', message: errorMessage || 'SendRequest failed', xmlPreview: xml.slice(0, 300) },
        { status: 502 }
      );
    }

    // Step 2: wait for report to be ready and retrieve it
    await new Promise(resolve => setTimeout(resolve, 3000));

    const getBase = 'https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService/GetStatement';
    const getUrl = new URL(getBase);
    getUrl.search = new URLSearchParams({
      t: String(t),
      q: String(q),
      v: String(version ?? '3'),
      ref: referenceCode,
    }).toString();

    const csvRes = await fetch(getUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        accept: 'text/plain,*/*;q=0.8',
        'user-agent': 'port-tracker/1.0',
      },
    });

    const csvText = await csvRes.text();

    if (csvText.toLowerCase().includes('error')) {
      return NextResponse.json(
        { status: 'Fail', message: csvText.slice(0, 200) },
        { status: 502 }
      );
    }

    const parser = new IBKRCSVParser({
      includeHeaders: true,
      dateFormat: 'yyyy-MM-dd',
      timeFormat: 'HH:mm:ss',
    });

    const parsedRows = parser.parseCSV(csvText);

    let actualDataType = dataType;
    if (dataType === 'auto') {
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

    const repo = await getRepo();
    let positionsSaved = 0;
    let tradesSaved = 0;

    if (actualDataType === 'positions' || actualDataType === 'mixed') {
      const positions = parser.convertToPositions(parsedRows);
      for (const position of positions) {
        await repo.savePosition(position);
      }
      positionsSaved = positions.length;
    }

    if (actualDataType === 'trades' || actualDataType === 'mixed') {
      const trades = parser.convertToTrades(parsedRows);
      for (const trade of trades) {
        await repo.saveTrade(trade);
      }
      tradesSaved = trades.length;
    }

    if (actualDataType === 'unknown') {
      const positions = parser.convertToPositions(parsedRows);
      const trades = parser.convertToTrades(parsedRows);
      for (const position of positions) {
        await repo.savePosition(position);
      }
      for (const trade of trades) {
        await repo.saveTrade(trade);
      }
      positionsSaved = positions.length;
      tradesSaved = trades.length;
    }

    return NextResponse.json({
      status: 'Success',
      referenceCode,
      rowsProcessed: parsedRows.length,
      positionsSaved,
      tradesSaved,
      timestamp,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unhandled error';
    return NextResponse.json({ message }, { status: 500 });
  }
}