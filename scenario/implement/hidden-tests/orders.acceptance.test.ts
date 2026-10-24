// Hidden acceptance tests of the implement eval (scenario/implement/). Never shown to uroboros: the harness copies this
// file into the workspace's test/ directory only after the run ends, then runs it. The fixed plan states every status and
// error code, so they are asserted exactly. One describe block per user story, plus the routes Foundational publishes.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createApp } from '../src/app.ts';
import { withPublicRoutes } from '../src/gateway.ts';
import { seededStore } from '../src/store.ts';
import { startApi, type TestApi } from './helpers.ts';

const BUYER = 'u_buyer_sam'; // placed o_seed
const SELLER = 'u_seller_ana'; // owns l_chair, the listing of o_seed, and l_lamp
const OTHER_SELLER = 'u_seller_leo';
const ADMIN = 'u_admin_kim';
const OTHER_BUYER = 'u_buyer_eve'; // added to the store by the test that needs a second buyer

let api: TestApi;
beforeEach(async () => {
  api = await startApi();
});
afterEach(async () => {
  await api.close();
});

const cancel = (id: string, as?: string) => api.request('POST', `/orders/${id}/cancel`, { as });
const fulfill = (id: string, as?: string) => api.request('POST', `/orders/${id}/fulfill`, { as });
const detail = (id: string, as?: string) => api.request('GET', `/orders/${id}`, { as });
const statusOf = (id: string) => api.store.orders.get(id)?.status;
const setStatus = (id: string, status: 'open' | 'fulfilled' | 'cancelled') => {
  api.store.orders.get(id)!.status = status;
};

describe('routes: the server publishes the three new routes', () => {
  it('none of them is refused by the route table', async () => {
    const server = createServer(withPublicRoutes(createApp(seededStore())));
    await new Promise<void>((resolve) => server.listen(0, resolve));
    try {
      const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      const call = async (method: string, path: string, as: string) => (await (await fetch(base + path, { method, headers: { 'x-user-id': as } })).json()) as { error?: string };
      assert.notEqual((await call('GET', '/orders/o_seed', BUYER)).error, 'route_not_found');
      assert.notEqual((await call('POST', '/orders/o_seed/cancel', BUYER)).error, 'route_not_found');
      assert.notEqual((await call('POST', '/orders/o_seed/fulfill', SELLER)).error, 'route_not_found');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

describe('US1: a buyer cancels an open order', () => {
  it('the buyer cancels their open order', async () => {
    const { status, body } = await cancel('o_seed', BUYER);
    assert.equal(status, 200);
    assert.deepEqual(body, { id: 'o_seed', listingId: 'l_chair', buyerId: BUYER, status: 'cancelled', createdAt: '2026-02-01T10:00:00.000Z' });
    assert.equal(statusOf('o_seed'), 'cancelled');
  });

  it('the listing keeps the rank the order gave it', async () => {
    const order = await api.request('POST', '/listings/l_lamp/orders', { as: BUYER });
    assert.equal(api.store.listings.get('l_lamp')?.rankScore, 13);
    assert.equal((await cancel(order.body.id, BUYER)).status, 200);
    assert.equal(api.store.listings.get('l_lamp')?.rankScore, 13);
  });

  it('refuses anyone but the buyer, and the order stays open', async () => {
    for (const as of [SELLER, OTHER_SELLER, ADMIN]) {
      assert.deepEqual(await cancel('o_seed', as), { status: 403, body: { error: 'not_order_buyer' } }, as);
    }
    assert.equal(statusOf('o_seed'), 'open');
  });

  it('refuses an order that is not open, a repeated cancel included', async () => {
    setStatus('o_seed', 'fulfilled');
    assert.deepEqual(await cancel('o_seed', BUYER), { status: 409, body: { error: 'order_not_open' } });
    assert.equal(statusOf('o_seed'), 'fulfilled');
    setStatus('o_seed', 'open');
    assert.equal((await cancel('o_seed', BUYER)).status, 200);
    assert.deepEqual(await cancel('o_seed', BUYER), { status: 409, body: { error: 'order_not_open' } });
  });

  it('answers an unknown order and an unidentified caller', async () => {
    assert.deepEqual(await cancel('o_nope', BUYER), { status: 404, body: { error: 'order_not_found' } });
    assert.deepEqual(await cancel('o_seed'), { status: 401, body: { error: 'unauthenticated' } });
    assert.equal(statusOf('o_seed'), 'open');
  });
});

describe("US2: a seller fulfills an open order on their listing", () => {
  it("the listing's seller fulfills an open order", async () => {
    const { status, body } = await fulfill('o_seed', SELLER);
    assert.equal(status, 200);
    assert.deepEqual(body, { id: 'o_seed', listingId: 'l_chair', buyerId: BUYER, status: 'fulfilled', createdAt: '2026-02-01T10:00:00.000Z' });
    assert.equal(statusOf('o_seed'), 'fulfilled');
  });

  it("refuses anyone but the listing's seller, and the order stays open", async () => {
    for (const as of [OTHER_SELLER, BUYER, ADMIN]) {
      assert.deepEqual(await fulfill('o_seed', as), { status: 403, body: { error: 'not_order_seller' } }, as);
    }
    assert.equal(statusOf('o_seed'), 'open');
  });

  it('refuses an order that is not open, a repeated fulfill included', async () => {
    setStatus('o_seed', 'cancelled');
    assert.deepEqual(await fulfill('o_seed', SELLER), { status: 409, body: { error: 'order_not_open' } });
    assert.equal(statusOf('o_seed'), 'cancelled');
    setStatus('o_seed', 'open');
    assert.equal((await fulfill('o_seed', SELLER)).status, 200);
    assert.deepEqual(await fulfill('o_seed', SELLER), { status: 409, body: { error: 'order_not_open' } });
  });

  it('answers an unknown order and an unidentified caller', async () => {
    assert.deepEqual(await fulfill('o_nope', SELLER), { status: 404, body: { error: 'order_not_found' } });
    assert.deepEqual(await fulfill('o_seed'), { status: 401, body: { error: 'unauthenticated' } });
    assert.equal(statusOf('o_seed'), 'open');
  });
});

describe('US3: the parties of an order see its detail', () => {
  it("the buyer, the listing's seller and an admin see the order", async () => {
    const expected = { id: 'o_seed', listingId: 'l_chair', buyerId: BUYER, status: 'open', createdAt: '2026-02-01T10:00:00.000Z' };
    for (const as of [BUYER, SELLER, ADMIN]) assert.deepEqual(await detail('o_seed', as), { status: 200, body: expected }, as);
  });

  it('refuses anyone else', async () => {
    api.store.users.set(OTHER_BUYER, { id: OTHER_BUYER, name: 'Eve', role: 'buyer' });
    for (const as of [OTHER_SELLER, OTHER_BUYER]) {
      assert.deepEqual(await detail('o_seed', as), { status: 403, body: { error: 'not_order_party' } }, as);
    }
  });

  it('shows the order as it is now', async () => {
    setStatus('o_seed', 'fulfilled');
    assert.equal((await detail('o_seed', BUYER)).body.status, 'fulfilled');
  });

  it('answers an unknown order and an unidentified caller', async () => {
    assert.deepEqual(await detail('o_nope', ADMIN), { status: 404, body: { error: 'order_not_found' } });
    assert.deepEqual(await detail('o_seed'), { status: 401, body: { error: 'unauthenticated' } });
  });
});
