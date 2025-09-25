import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getServerRepo, UnauthorizedError } from '@/lib/repo/server';

function handleError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  throw error;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const repo = await getServerRepo();
    const item = await repo.getExpense(id);
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const repo = await getServerRepo();
    await repo.deleteExpense(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

