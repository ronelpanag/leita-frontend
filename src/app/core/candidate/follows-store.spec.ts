import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import type { Company } from '../api/api-types';
import { ApiClient } from '../api/api-client';
import { FollowsStore } from './follows-store';

const COMPANIES: readonly Company[] = [
  { id: 'co-1', name: 'Fjellheim AS', description: null, website: null },
];

function setup(apiOverrides: object = {}) {
  const api = {
    getFollowedCompanies: vi.fn().mockReturnValue(of(COMPANIES)),
    followCompany: vi.fn().mockReturnValue(of(undefined)),
    unfollowCompany: vi.fn().mockReturnValue(of(undefined)),
    ...apiOverrides,
  };
  TestBed.configureTestingModule({ providers: [{ provide: ApiClient, useValue: api }] });
  return { api, store: TestBed.inject(FollowsStore) };
}

describe('FollowsStore', () => {
  it('loads the followed list and answers isFollowing', async () => {
    const { store } = setup();
    expect(store.loaded()).toBe(false);
    await store.load();
    expect(store.loaded()).toBe(true);
    expect(store.isFollowing('co-1')).toBe(true);
    expect(store.isFollowing('co-2')).toBe(false);
  });

  it('follow posts then refreshes the authoritative list', async () => {
    const refreshed = [
      ...COMPANIES,
      { id: 'co-2', name: 'Brevik Studio', description: null, website: null },
    ];
    const { api, store } = setup({
      getFollowedCompanies: vi
        .fn()
        .mockReturnValueOnce(of(COMPANIES))
        .mockReturnValueOnce(of(refreshed)),
    });
    await store.load();
    await store.follow('co-2');
    expect(api.followCompany).toHaveBeenCalledWith('co-2');
    expect(store.companies()?.find((c) => c.id === 'co-2')?.name).toBe('Brevik Studio');
  });

  it('rolls back the optimistic row when the follow fails', async () => {
    const { store } = setup({
      followCompany: vi.fn().mockReturnValue(throwError(() => new Error('500'))),
    });
    await store.load();
    await expect(store.follow('co-2')).rejects.toThrow();
    expect(store.isFollowing('co-2')).toBe(false);
    expect(store.isPending('co-2')).toBe(false);
  });

  it('rolls back an optimistic unfollow on failure', async () => {
    const { store } = setup({
      unfollowCompany: vi.fn().mockReturnValue(throwError(() => new Error('500'))),
    });
    await store.load();
    await expect(store.unfollow('co-1')).rejects.toThrow();
    expect(store.isFollowing('co-1')).toBe(true);
  });

  it('reset clears state for the next session', async () => {
    const { store } = setup();
    await store.load();
    store.reset();
    expect(store.loaded()).toBe(false);
    expect(store.isFollowing('co-1')).toBe(false);
  });
});
