import { NextRequest, NextResponse } from 'next/server';
import { getServerRepo as getRepo } from '@/lib/repo/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = await getRepo();
  const item = await repo.getAsset(id);
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = await getRepo();
  await repo.deleteAsset(id);
  return new NextResponse(null, { status: 204 });
}
