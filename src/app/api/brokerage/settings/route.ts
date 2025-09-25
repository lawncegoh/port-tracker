import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const setting = await prisma.brokerageSetting.findUnique({ where: { userId } });
  return NextResponse.json({ marginLoan: Number(setting?.marginLoan ?? 0) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const marginLoan = Number(body?.marginLoan);
  if (isNaN(marginLoan) || marginLoan < 0) {
    return NextResponse.json({ error: 'marginLoan must be a non-negative number' }, { status: 400 });
  }

  await prisma.brokerageSetting.upsert({
    where: { userId },
    create: { userId, marginLoan },
    update: { marginLoan },
  });

  return NextResponse.json({ ok: true, marginLoan });
}

