import type { RawQuery } from '../../core/persistence/store.js';

export type QueryCustomizer = (query: RawQuery) => void;
