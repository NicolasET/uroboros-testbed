// Hidden tests of the `medium` mode. Never shown to uroboros: copied in after the run, like the other hidden tests.
// Seed: l_lamp 2500 (rank 12), l_chair 12000 (rank 30), l_desk 40000 (rank 21); search answers best ranked first.
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

const is4xx = (status: number) => status >= 400 && status < 500;
const search = (query: string) => api.request('GET', `/listings${query}`);
const ids = async (query: string) => (await search(query)).body.map((l: { id: string }) => l.id);

describe('medium: the maximum price filter', () => {
  it('keeps the listings at or under the amount, in the same order, and changes nothing without it', async () => {
    assert.deepEqual(await ids('?maxPrice=12000'), ['l_chair', 'l_lamp']);
    assert.deepEqual(await ids('?maxPrice=2499'), []);
    assert.deepEqual(await ids(''), ['l_chair', 'l_desk', 'l_lamp']);
  });

  it('combines with the title filter', async () => {
    assert.deepEqual(await ids('?q=desk&maxPrice=3000'), ['l_lamp']);
    assert.deepEqual(await ids('?q=desk&maxPrice=40000'), ['l_desk', 'l_lamp']);
  });

  it('refuses an amount that is not a number', async () => {
    assert.ok(is4xx((await search('?maxPrice=barato')).status));
  });

  it('refuses zero, a negative amount and a decimal', async () => {
    for (const value of ['0', '-5', '12.5']) assert.ok(is4xx((await search(`?maxPrice=${value}`)).status), `maxPrice=${value}`);
  });
});
