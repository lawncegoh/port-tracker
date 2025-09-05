import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { token, queryId, version = '3' } = await req.json() as {
      token: string | number;
      queryId: string | number;
      version?: string | number;
    };

    if (!token || !queryId) {
      return NextResponse.json({ message: 'Missing token or queryId' }, { status: 400 });
    }

    // === Python:
    // requestBase = "https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService"
    // send_path = "/SendRequest"
    // requests.get(url=requestBase+send_path, params={"t":token,"q":queryId,"v":3})
    const base = 'https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService/SendRequest';
    const url = new URL(base);
    url.search = new URLSearchParams({
      t: String(token),
      q: String(queryId),
      v: String(version ?? '3'),
    }).toString();

    const res = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
        'user-agent': 'port-tracker/1.0',
      },
    });

    const xml = await res.text();

    // Parse XML like:
    // <FlexStatementResponse ...>
    //   <Status>Success</Status>
    //   <ReferenceCode>1234567890</ReferenceCode>
    //   <url>...</url>
    // </FlexStatementResponse>
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

    return NextResponse.json({ status: 'Success', referenceCode, timestamp });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Unhandled error' }, { status: 500 });
  }
}