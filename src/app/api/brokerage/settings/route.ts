import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'brokerage.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function GET() {
  ensureDir();
  if (!fs.existsSync(FILE)) {
    return NextResponse.json({ marginLoan: 0 });
  }
  try {
    const raw = fs.readFileSync(FILE, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json({ marginLoan: Number(data.marginLoan) || 0 });
  } catch {
    return NextResponse.json({ marginLoan: 0 });
  }
}

export async function POST(req: NextRequest) {
  ensureDir();
  const body = await req.json().catch(() => ({}));
  const marginLoan = Number(body?.marginLoan);
  if (isNaN(marginLoan) || marginLoan < 0) {
    return NextResponse.json({ error: 'marginLoan must be a non-negative number' }, { status: 400 });
  }
  fs.writeFileSync(FILE, JSON.stringify({ marginLoan }, null, 2));
  return NextResponse.json({ ok: true, marginLoan });
}

