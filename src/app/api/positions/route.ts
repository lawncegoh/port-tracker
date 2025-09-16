import { NextRequest, NextResponse } from 'next/server';
import { getServerRepo as getRepo } from '@/lib/repo/server';

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get('account') || undefined;
  const repo = await getRepo();
  const items = await repo.listPositions(account || undefined);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const repo = await getRepo();
  await repo.savePosition({ ...body, lastUpdated: new Date(body.lastUpdated ?? Date.now()) });
  return NextResponse.json({ ok: true });
}
