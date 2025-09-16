import { Repo } from './interface';
import { MemoryRepo } from './memory';

export async function createRepo(): Promise<Repo> {
  const isServer = typeof window === 'undefined';
  const dataStore = process.env.DATA_STORE || 'file';

  if (isServer) {
    if (dataStore === 'file') {
      const { FileRepo } = await import('./file');
      const repo: Repo = new FileRepo();
      await repo.initialize();
      return repo;
    }
    // Fallback to memory on server
    const repo = new MemoryRepo();
    await repo.initialize();
    return repo;
  }

  // Client side: use WebRepo to talk to API
  const { WebRepo } = await import('./web');
  const repo: Repo = new WebRepo();
  await repo.initialize();
  return repo;

  // Last resort: in-memory (no persistence)
  // (unreachable)
}

// Singleton instance
let repoInstance: Repo | null = null;

export async function getRepo(): Promise<Repo> {
  if (!repoInstance) {
    repoInstance = await createRepo();
  }
  return repoInstance;
}
