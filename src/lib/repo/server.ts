import 'server-only';
import { Repo } from './interface';
import { MemoryRepo } from './memory';
import { PrismaRepo } from './prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export async function getServerRepo(): Promise<Repo> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const dataStore = process.env.DATA_STORE || 'prisma';
  if (dataStore === 'memory') {
    const repo = new MemoryRepo();
    await repo.initialize();
    return repo;
  }

  const repo = new PrismaRepo(session.user.id);
  await repo.initialize();
  return repo;
}

