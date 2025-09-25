import { NextRequest, NextResponse } from 'next/server';
import { getServerRepo as getRepo, UnauthorizedError } from '@/lib/repo/server';

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
    const type = req.nextUrl.searchParams.get('type') || undefined;
    const repo = await getRepo();
    const items = await repo.listLiabilities(type || undefined);
    return NextResponse.json(items);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repo = await getRepo();
    await repo.saveLiability({ ...body, dueDate: new Date(body.dueDate ?? Date.now()) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
