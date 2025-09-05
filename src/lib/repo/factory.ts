import { Repo } from './interface';
import { MemoryRepo } from './memory';

export async function createRepo(): Promise<Repo> {
  const dataStore = process.env.DATA_STORE || 'memory';
  
  if (dataStore === 'sqlite') {
    // TODO: Implement SQLite repository when Prisma is set up
    console.log('SQLite repository not yet implemented, falling back to memory');
    const repo = new MemoryRepo();
    await repo.initialize();
    return repo;
  }
  
  // Default to memory repository
  const repo = new MemoryRepo();
  await repo.initialize();
  return repo;
}

// Singleton instance
let repoInstance: Repo | null = null;

export async function getRepo(): Promise<Repo> {
  if (!repoInstance) {
    repoInstance = await createRepo();
  }
  return repoInstance;
}
