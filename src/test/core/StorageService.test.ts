import { beforeEach, describe, expect, it } from 'vitest';

import { StorageService } from '@/core/services/StorageService';

describe('StorageService', () => {
  let storage: StorageService;

  beforeEach(() => {
    storage = new StorageService('test');
    storage.clear();
  });

  it('stores and retrieves values', () => {
    storage.set('greeting', { message: 'hello' });
    const result = storage.get('greeting');

    expect(result).toEqual({ message: 'hello' });
  });

  it('returns default value when missing', () => {
    const result = storage.get('missing', { fallback: true });

    expect(result).toEqual({ fallback: true });
  });

  it('removes values', () => {
    storage.set('ephemeral', 123);
    storage.remove('ephemeral');

    expect(storage.get('ephemeral')).toBeNull();
  });
});
