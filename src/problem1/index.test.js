'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { inspect } = require('node:util');
const { sum_to_n_a, sum_to_n_b, sum_to_n_c, MAX_N } = require('./index.js');

const implementations = { sum_to_n_a, sum_to_n_b, sum_to_n_c };

// Reference computed with BigInt, so the oracle itself can't lose precision.
function exactSum(n) {
  const m = BigInt(Math.abs(n));
  const sum = (m * (m + 1n)) / 2n;
  return Number(n < 0 ? -sum : sum);
}

for (const [name, sumToN] of Object.entries(implementations)) {
  describe(name, () => {
    it('matches the example in the spec: sum_to_n(5) === 15', () => {
      assert.equal(sumToN(5), 15);
    });

    it('sums small inputs', () => {
      const cases = [[0, 0], [1, 1], [2, 3], [3, 6], [10, 55], [100, 5050], [1000, 500500]];
      for (const [n, expected] of cases) {
        assert.equal(sumToN(n), expected, `${name}(${n})`);
      }
    });

    it('mirrors negative inputs: sum_to_n(-n) === -sum_to_n(n)', () => {
      const cases = [[-1, -1], [-2, -3], [-5, -15], [-100, -5050]];
      for (const [n, expected] of cases) {
        assert.equal(sumToN(n), expected, `${name}(${n})`);
      }
    });

    it('treats -0 like 0', () => {
      assert.equal(sumToN(-0), 0); // assert/strict compares with Object.is, so a -0 result fails
    });

    it(`is exact at both ends of the valid range (n = ±${MAX_N})`, () => {
      assert.equal(sumToN(MAX_N), 9007199187632128); // 2^53 - 2^26
      assert.equal(sumToN(-MAX_N), -9007199187632128);
    });

    it('throws TypeError for anything that is not an integer', () => {
      for (const input of [2.5, -0.1, NaN, Infinity, -Infinity, '5', null, undefined, 5n, [5], {}]) {
        assert.throws(() => sumToN(input), TypeError, `${name}(${inspect(input)})`);
      }
    });

    it('throws RangeError when the sum would not be a safe integer', () => {
      for (const input of [MAX_N + 1, -(MAX_N + 1), Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]) {
        assert.throws(() => sumToN(input), RangeError, `${name}(${input})`);
      }
    });
  });
}

describe('cross-check against an exact BigInt reference', () => {
  it('all three agree for every n in [-2000, 2000]', () => {
    for (let n = -2000; n <= 2000; n++) {
      const expected = exactSum(n);
      for (const [name, sumToN] of Object.entries(implementations)) {
        assert.equal(sumToN(n), expected, `${name}(${n})`);
      }
    }
  });

  it('b and c agree across the whole valid range', () => {
    // The odd prime stride samples odd and even n alike; the O(n) loop is too slow to sweep this.
    for (let n = -MAX_N; n <= MAX_N; n += 65521) {
      const expected = exactSum(n);
      assert.equal(sum_to_n_b(n), expected, `sum_to_n_b(${n})`);
      assert.equal(sum_to_n_c(n), expected, `sum_to_n_c(${n})`);
    }
  });
});

describe('MAX_N', () => {
  it('is the largest n whose sum fits in Number.MAX_SAFE_INTEGER', () => {
    const triangular = (k) => (k * (k + 1n)) / 2n;
    assert.ok(triangular(BigInt(MAX_N)) <= BigInt(Number.MAX_SAFE_INTEGER));
    assert.ok(triangular(BigInt(MAX_N + 1)) > BigInt(Number.MAX_SAFE_INTEGER));
  });
});
