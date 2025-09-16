import { Repo } from './interface';
import { MemoryRepo } from './memory';

export async function getClientRepo(): Promise<Repo> {
  // Always use WebRepo on client, fallback to in-memory if something goes wrong
  try {
    const { WebRepo } = await import('./web');
    const repo: Repo = new WebRepo();
    await repo.initialize();
    return repo;
  } catch {
    const repo = new MemoryRepo();
    await repo.initialize();
    return repo;
  }
}

