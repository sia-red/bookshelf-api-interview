import { MemoryStore } from './memory-store.js';
import type { Store } from './store.js';

let instance: Store | undefined;

export function initializePersistence(): Store {
  instance = new MemoryStore();
  return instance;
}

export function getStore(): Store {
  if (!instance) {
    throw new Error('Persistence not initialized. Call initializePersistence() first.');
  }
  return instance;
}
