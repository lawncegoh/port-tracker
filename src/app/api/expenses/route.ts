import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getServerRepo } from '@/lib/repo/server';

export async function GET(req: NextRequest) {
  const repo = await getServerRepo();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || undefined; // YYYY-MM
  const list = await repo.listExpenses(month);
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const repo = await getServerRepo();
  const body = await req.json();
  // basic coercion of dates
  const expense = {
    ...body,
    date: new Date(body.date ?? Date.now()),
    createdAt: new Date(body.createdAt ?? Date.now()),
  };
  await repo.saveExpense(expense);
  return NextResponse.json({ ok: true });
}

