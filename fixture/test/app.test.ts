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

describe('search', () => {
  it('returns listings best ranked first', async () => {
    const { status, body } = await api.request('GET', '/listings');
    assert.equal(status, 200);
    assert.deepEqual(body.map((l: { id: string }) => l.id), ['l_chair', 'l_desk', 'l_lamp']);
  });

  it('filters by title', async () => {
    const { body } = await api.request('GET', '/listings?q=desk');
    assert.deepEqual(body.map((l: { id: string }) => l.id), ['l_desk', 'l_lamp']);
  });
});

describe('listings', () => {
  it('gets one listing', async () => {
    const { status, body } = await api.request('GET', '/listings/l_lamp');
    assert.equal(status, 200);
    assert.equal(body.title, 'Desk lamp');
  });

  it('answers 404 for an unknown listing', async () => {
    const { status } = await api.request('GET', '/listings/nope');
    assert.equal(status, 404);
  });

  it('lets a seller publish a listing with no rank', async () => {
    const { status, body } = await api.request('POST', '/listings', { as: 'u_seller_leo', body: { title: 'Bookshelf', priceCents: 9000 } });
    assert.equal(status, 201);
    assert.equal(body.sellerId, 'u_seller_leo');
    assert.equal(body.rankScore, 0);
  });

  it('refuses publishing from a buyer', async () => {
    const { status } = await api.request('POST', '/listings', { as: 'u_buyer_sam', body: { title: 'X', priceCents: 100 } });
    assert.equal(status, 403);
  });

  it('refuses an invalid price', async () => {
    const { status } = await api.request('POST', '/listings', { as: 'u_seller_leo', body: { title: 'X', priceCents: -1 } });
    assert.equal(status, 400);
  });
});

describe('orders', () => {
  it('lets a buyer order and boosts the listing rank', async () => {
    const { status } = await api.request('POST', '/listings/l_lamp/orders', { as: 'u_buyer_sam' });
    assert.equal(status, 201);
    assert.equal(api.store.listings.get('l_lamp')?.rankScore, 13);
  });

  it('refuses orders from sellers', async () => {
    const { status } = await api.request('POST', '/listings/l_lamp/orders', { as: 'u_seller_ana' });
    assert.equal(status, 403);
  });

  it('shows sellers the orders on their listings only', async () => {
    const ana = await api.request('GET', '/orders', { as: 'u_seller_ana' });
    const leo = await api.request('GET', '/orders', { as: 'u_seller_leo' });
    assert.equal(ana.body.length, 1);
    assert.equal(leo.body.length, 0);
  });

  it('requires a known user', async () => {
    const { status } = await api.request('GET', '/orders');
    assert.equal(status, 401);
  });
});
