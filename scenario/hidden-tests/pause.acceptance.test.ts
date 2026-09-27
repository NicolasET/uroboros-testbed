// Hidden acceptance tests. Never shown to uroboros: the harness copies this file into the
// workspace's test/ directory only after the run ends, then runs it. Status codes are asserted
// by class (2xx / 4xx) because the idea and truth.md fix the behavior, not the exact codes.
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { startApi, type TestApi } from './helpers.ts';

const OWNER = 'u_seller_ana'; // owns l_lamp and l_chair
const OTHER_SELLER = 'u_seller_leo';
const BUYER = 'u_buyer_sam';
const ADMIN = 'u_admin_kim';

let api: TestApi;
beforeEach(async () => {
  api = await startApi();
});
afterEach(async () => {
  await api.close();
});

const is2xx = (status: number) => status >= 200 && status < 300;
const is4xx = (status: number) => status >= 400 && status < 500;
const pause = (id: string, as: string) => api.request('POST', `/listings/${id}/pause`, { as });
const resume = (id: string, as: string) => api.request('POST', `/listings/${id}/resume`, { as });
const statusOf = async (id: string) => (await api.request('GET', `/listings/${id}`)).body.status;
const searchIds = async () => (await api.request('GET', '/listings')).body.map((l: { id: string }) => l.id);

describe('core: pause and resume', () => {
  it('the owner pauses a listing and it becomes paused', async () => {
    assert.ok(is2xx((await pause('l_lamp', OWNER)).status));
    assert.equal(await statusOf('l_lamp'), 'paused');
  });

  it('the owner resumes a paused listing and it becomes active', async () => {
    await pause('l_lamp', OWNER);
    assert.ok(is2xx((await resume('l_lamp', OWNER)).status));
    assert.equal(await statusOf('l_lamp'), 'active');
  });
});

describe('P1: who can pause and resume', () => {
  // Each refusal test ends with the owner succeeding, so a missing route (404) cannot pass as a refusal.
  it('refuses another seller', async () => {
    assert.ok(is4xx((await pause('l_lamp', OTHER_SELLER)).status));
    assert.equal(await statusOf('l_lamp'), 'active');
    assert.ok(is2xx((await pause('l_lamp', OWNER)).status));
  });

  it('refuses a buyer', async () => {
    assert.ok(is4xx((await pause('l_lamp', BUYER)).status));
    assert.equal(await statusOf('l_lamp'), 'active');
    assert.ok(is2xx((await pause('l_lamp', OWNER)).status));
  });

  it('lets an admin pause and resume', async () => {
    assert.ok(is2xx((await pause('l_lamp', ADMIN)).status));
    assert.ok(is2xx((await resume('l_lamp', ADMIN)).status));
  });
});

describe('P2: visibility while paused', () => {
  it('hides a paused listing from search', async () => {
    await pause('l_lamp', OWNER);
    assert.ok(!(await searchIds()).includes('l_lamp'));
  });

  it('still returns a paused listing by id', async () => {
    await pause('l_lamp', OWNER);
    const { status, body } = await api.request('GET', '/listings/l_lamp');
    assert.equal(status, 200);
    assert.equal(body.status, 'paused');
  });
});

describe('P3: ordering while paused', () => {
  it('refuses an order on a paused listing', async () => {
    assert.ok(is2xx((await pause('l_lamp', OWNER)).status));
    assert.ok(is4xx((await api.request('POST', '/listings/l_lamp/orders', { as: BUYER })).status));
  });
});

describe('P4: the rank score survives a pause', () => {
  it('keeps the exact rankScore across pause and resume', async () => {
    const before = api.store.listings.get('l_chair')?.rankScore;
    assert.ok(is2xx((await pause('l_chair', OWNER)).status));
    assert.equal(await statusOf('l_chair'), 'paused');
    assert.ok(is2xx((await resume('l_chair', OWNER)).status));
    assert.equal(api.store.listings.get('l_chair')?.rankScore, before);
  });
});

describe('P5: repeated actions are idempotent', () => {
  it('pausing twice succeeds and stays paused', async () => {
    await pause('l_lamp', OWNER);
    assert.ok(is2xx((await pause('l_lamp', OWNER)).status));
    assert.equal(await statusOf('l_lamp'), 'paused');
  });

  it('resuming an active listing succeeds and stays active', async () => {
    assert.ok(is2xx((await resume('l_lamp', OWNER)).status));
    assert.equal(await statusOf('l_lamp'), 'active');
  });
});
