import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getServerRepo } from '@/lib/repo/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = await getServerRepo();
  const item = await repo.getExpense(id);
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = await getServerRepo();
  await repo.deleteExpense(id);
  return NextResponse.json({ ok: true });
}

