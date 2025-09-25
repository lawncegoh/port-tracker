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

export async function GET(req: NextRequest) {
  try {
    const repo = await getServerRepo();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || undefined; // YYYY-MM
    const list = await repo.listExpenses(month);
    return NextResponse.json(list);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const repo = await getServerRepo();
    const body = await req.json();
    const expense = {
      ...body,
      date: new Date(body.date ?? Date.now()),
      createdAt: new Date(body.createdAt ?? Date.now()),
    };
    await repo.saveExpense(expense);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

