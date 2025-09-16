import 'server-only';
import { Repo } from './interface';
import { MemoryRepo } from './memory';

export async function getServerRepo(): Promise<Repo> {
  const dataStore = process.env.DATA_STORE || 'file';
  if (dataStore === 'file') {
    const { FileRepo } = await import('./file');
    const repo: Repo = new FileRepo();
    await repo.initialize();
    return repo;
  }
  const repo = new MemoryRepo();
  await repo.initialize();
  return repo;
}

