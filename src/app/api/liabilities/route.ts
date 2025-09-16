import { NextRequest, NextResponse } from 'next/server';
import { getServerRepo as getRepo } from '@/lib/repo/server';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || undefined;
  const repo = await getRepo();
  const items = await repo.listLiabilities(type || undefined);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const repo = await getRepo();
  await repo.saveLiability({ ...body, dueDate: new Date(body.dueDate ?? Date.now()) });
  return NextResponse.json({ ok: true });
}
