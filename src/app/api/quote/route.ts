import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Quote = { symbol: string; price: number; currency?: string; exchange?: string };

// Simple in-memory cache to reduce network calls and rate limiting
const cache = new Map<string, { value: Quote; ts: number }>();
const TTL_MS = 60_000; // 60 seconds

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  const key = symbol.toUpperCase();

  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.ts < TTL_MS) {
    return NextResponse.json(cached.value);
  }

  const s = encodeURIComponent(key);
  const urls = [
    // Quote endpoints
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${s}`,
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${s}`,
    // Quote summary
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${s}?modules=price`,
    // Chart meta fallback (has regularMarketPrice)
    `https://query1.finance.yahoo.com/v8/finance/chart/${s}?range=1d&interval=1m`,
  ];

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 5000);
  let lastError: any = null;

  try {
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PortTracker/1.0)',
            'Accept': 'application/json'
          }
        });
        if (!res.ok) { lastError = new Error(`HTTP ${res.status}`); continue; }
        const data = await res.json();

        // v7 shape
        const v7 = data?.quoteResponse?.result?.[0];
        if (v7) {
          const price = v7.regularMarketPrice ?? v7.postMarketPrice ?? v7.preMarketPrice;
          if (price) {
            const out: Quote = { symbol: key, price: Number(price), currency: v7.currency, exchange: v7.fullExchangeName || v7.exchange }; 
            cache.set(key, { value: out, ts: now });
            clearTimeout(id);
            return NextResponse.json(out);
          }
        }

        // v10 price module shape
        const priceModule = data?.quoteSummary?.result?.[0]?.price;
        const v10 = priceModule?.regularMarketPrice?.raw ?? priceModule?.postMarketPrice?.raw ?? priceModule?.preMarketPrice?.raw;
        if (v10) {
          const out: Quote = { symbol: key, price: Number(v10), currency: priceModule?.currency, exchange: priceModule?.exchangeName };
          cache.set(key, { value: out, ts: now });
          clearTimeout(id);
          return NextResponse.json(out);
        }

        // v8 chart meta
        const meta = data?.chart?.result?.[0]?.meta;
        const chartPrice = meta?.regularMarketPrice ?? meta?.previousClose;
        if (chartPrice) {
          const out: Quote = { symbol: key, price: Number(chartPrice), currency: meta?.currency, exchange: meta?.exchangeName };
          cache.set(key, { value: out, ts: now });
          clearTimeout(id);
          return NextResponse.json(out);
        }
      } catch (e) {
        lastError = e;
        continue;
      }
    }
    clearTimeout(id);
    return NextResponse.json({ error: 'not found or unreachable', detail: String(lastError) }, { status: 502 });
  } catch (e: any) {
    clearTimeout(id);
    return NextResponse.json({ error: e?.message || 'fetch error' }, { status: 500 });
  }
}
