import { NextRequest, NextResponse } from 'next/server';
import { getServerRepo as getRepo } from '@/lib/repo/server';

export async function GET() {
  const repo = await getRepo();
  const items = await repo.listProperties();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const repo = await getRepo();
  await repo.saveProperty({ ...body, purchaseDate: new Date(body.purchaseDate ?? Date.now()) });
  return NextResponse.json({ ok: true });
}
