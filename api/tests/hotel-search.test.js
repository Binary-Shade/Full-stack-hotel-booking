import assert from 'node:assert/strict';
import test from 'node:test';
import Hotel from '../models/Hotel.js';
import { getAllHotel } from '../controllers/hotel.js';

test('hotel search applies validated city, type and inclusive price filters', async () => {
  const originalFind = Hotel.find;
  const calls = [];
  Hotel.find = filter => ({ limit: async limit => {
    calls.push({ filter, limit });
    return [{ _id: 'fixture' }];
  } });
  try {
    const search = async query => {
      let body;
      let error;
      const response = { status(code) { assert.equal(code, 200); return this; }, json(value) { body = value; } };
      await getAllHotel({ query }, response, value => { error = value; });
      return { body, error };
    };
    const result = await search({ city: 'london', type: 'hotel', featured: 'true', min: '0', max: '100.50', limit: '4' });
    assert.equal(result.error, undefined);
    assert.deepEqual(calls.pop(), { filter: { city: 'london', type: 'hotel', featured: true, cheapestPrice: { $gte: 0, $lte: 100.5 } }, limit: 4 });
    assert.deepEqual(result.body, [{ _id: 'fixture' }]);
    await search({});
    assert.deepEqual(calls.pop(), { filter: {}, limit: 40 });
    await search({ min: '10' });
    assert.deepEqual(calls.pop().filter, { cheapestPrice: { $gte: 10 } });
    for (const query of [{ min: '-1' }, { max: 'NaN' }, { min: '' }, { min: 'Infinity' }, { min: { $gt: 0 } }, { max: ['10'] }, { min: '101', max: '100' }]) {
      const invalid = await search(query);
      assert.equal(invalid.error?.status, 400, 'invalid filters must be rejected before querying MongoDB');
      assert.equal(invalid.body, undefined);
    }
    assert.equal(calls.length, 0);
  } finally {
    Hotel.find = originalFind;
  }
});
