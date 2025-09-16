import { NextRequest, NextResponse } from 'next/server';
import { getServerRepo as getRepo } from '@/lib/repo/server';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || undefined;
  const repo = await getRepo();
  const items = await repo.listAssets(type || undefined);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const repo = await getRepo();
  await repo.saveAsset({ ...body, lastUpdated: new Date(body.lastUpdated ?? Date.now()) });
  return NextResponse.json({ ok: true });
}
