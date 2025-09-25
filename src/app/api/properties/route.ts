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

export async function GET() {
  try {
    const repo = await getRepo();
    const items = await repo.listProperties();
    return NextResponse.json(items);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repo = await getRepo();
    await repo.saveProperty({ ...body, purchaseDate: new Date(body.purchaseDate ?? Date.now()) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
