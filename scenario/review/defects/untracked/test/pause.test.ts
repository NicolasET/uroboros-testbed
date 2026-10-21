import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { startApi, type TestApi } from './helpers.ts';

let api: TestApi;
beforeEach(async () => {
  api = await startApi();
});
afterEach(async () => {
  await api.close();
});

const ids = (body: { id: string }[]) => body.map((l) => l.id);

describe('pause and resume', () => {
  it('lets the owner pause a listing, keeping its rankScore (US1/AC1)', async () => {
    const { status, body } = await api.request('POST', '/listings/l_lamp/pause', { as: 'u_seller_ana' });
    assert.equal(status, 200);
    assert.equal(body.status, 'paused');
    assert.equal(body.rankScore, 12);
  });

  it('hides a paused listing from search (US1/AC2)', async () => {
    await api.request('POST', '/listings/l_lamp/pause', { as: 'u_seller_ana' });
    const { body } = await api.request('GET', '/listings');
    assert.deepEqual(ids(body), ['l_chair', 'l_desk']);
  });

  it('still returns a paused listing by id (US1/AC3)', async () => {
    await api.request('POST', '/listings/l_lamp/pause', { as: 'u_seller_ana' });
    const { status, body } = await api.request('GET', '/listings/l_lamp');
    assert.equal(status, 200);
    assert.equal(body.status, 'paused');
  });

  it('refuses orders on a paused listing (US1/AC4)', async () => {
    await api.request('POST', '/listings/l_lamp/pause', { as: 'u_seller_ana' });
    const { status, body } = await api.request('POST', '/listings/l_lamp/orders', { as: 'u_buyer_sam' });
    assert.equal(status, 409);
    assert.equal(body.error, 'listing_paused');
  });

  it('resumes a listing with the rankScore it had when paused (US2/AC1)', async () => {
    await api.request('POST', '/listings/l_lamp/pause', { as: 'u_seller_ana' });
    const { status, body } = await api.request('POST', '/listings/l_lamp/resume', { as: 'u_seller_ana' });
    assert.equal(status, 200);
    assert.equal(body.status, 'active');
    assert.equal(body.rankScore, 12);
  });

  it('lists a resumed listing in search again (US2/AC2)', async () => {
    await api.request('POST', '/listings/l_lamp/pause', { as: 'u_seller_ana' });
    await api.request('POST', '/listings/l_lamp/resume', { as: 'u_seller_ana' });
    const { body } = await api.request('GET', '/listings');
    assert.deepEqual(ids(body), ['l_chair', 'l_desk', 'l_lamp']);
  });

  it('refuses a buyer, an anonymous caller and another seller (US3/AC1)', async () => {
    for (const action of ['pause', 'resume']) {
      const { status, body } = await api.request('POST', `/listings/l_lamp/${action}`, { as: 'u_buyer_sam' });
      assert.equal(status, 403);
      assert.equal(body.error, 'not_listing_owner');
    }
    assert.equal((await api.request('POST', '/listings/l_lamp/pause')).status, 401);
    await api.request('POST', '/listings/l_lamp/pause', { as: 'u_seller_ana' });
    const leo = await api.request('POST', '/listings/l_lamp/resume', { as: 'u_seller_leo' });
    assert.equal(leo.status, 403);
    assert.equal(api.store.listings.get('l_lamp')?.status, 'paused');
  });

  it('lets an admin pause and resume any listing (US3/AC2)', async () => {
    assert.equal((await api.request('POST', '/listings/l_desk/pause', { as: 'u_admin_kim' })).status, 200);
    assert.equal((await api.request('POST', '/listings/l_desk/resume', { as: 'u_admin_kim' })).status, 200);
  });

  it('treats a repeated pause or resume as a success that changes nothing (US3/AC3)', async () => {
    await api.request('POST', '/listings/l_lamp/pause', { as: 'u_seller_ana' });
    const again = await api.request('POST', '/listings/l_lamp/pause', { as: 'u_seller_ana' });
    assert.equal(again.status, 200);
    assert.equal(again.body.status, 'paused');
    assert.equal(again.body.rankScore, 12);
    const active = await api.request('POST', '/listings/l_desk/resume', { as: 'u_seller_leo' });
    assert.equal(active.status, 200);
    assert.equal(active.body.status, 'active');
  });
});
