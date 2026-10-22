'use strict';

/**
 * Problem 1: Three ways to sum to n
 *
 * All three implementations share one contract:
 *   - sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15, and sum_to_n(0) === 0.
 *   - Negative n mirrors the positive case: sum_to_n(-5) === -15.
 *   - Valid input is any integer with |n| <= MAX_N, the largest n whose sum stays
 *     within Number.MAX_SAFE_INTEGER. Results are exact across that whole range.
 *   - Anything else throws instead of returning a wrong number: TypeError for
 *     non-integers, RangeError for |n| > MAX_N.
 */

/**
 * A: Iterative. O(n) time, O(1) space.
 * The literal 1 + 2 + ... + |n|: the easiest to trust, and the slowest.
 */
var sum_to_n_a = function (n) {
  assertValidInput(n);
  var limit = Math.abs(n);
  var sum = 0;
  for (var i = 1; i <= limit; i++) {
    sum += i;
  }
  return n < 0 ? -sum : sum;
};

/**
 * B: Recursive divide and conquer. O(log n) time, O(log n) stack.
 * The upper half of 1..2k is the lower half shifted up by k, so
 *   S(2k) = 2 * S(k) + k * k   and   S(2k + 1) = S(2k) + (2k + 1).
 * Halving on every call keeps the recursion at most 27 calls deep over the whole
 * valid range, whereas the textbook `n + S(n - 1)` overflows the stack near n = 11,000.
 */
var sum_to_n_b = function (n) {
  assertValidInput(n);
  var sum = sumByHalving(Math.abs(n));
  return n < 0 ? -sum : sum;
};

function sumByHalving(m) {
  if (m < 2) return m; // S(0) = 0, S(1) = 1
  var half = Math.floor(m / 2);
  var sumToEven = 2 * sumByHalving(half) + half * half; // S(2 * half)
  return m % 2 === 0 ? sumToEven : sumToEven + m;
}

/**
 * C: Closed form (Gauss). O(1) time, O(1) space. The one to use in practice.
 * Pairing 1 with m, 2 with m - 1, ... gives m / 2 pairs that each sum to m + 1.
 *
 * m * (m + 1) can exceed MAX_SAFE_INTEGER even when the result doesn't, but it is
 * always even and below 2^54, and every even integer below 2^54 is exactly
 * representable as a double, so neither the product nor the halving loses precision.
 */
var sum_to_n_c = function (n) {
  assertValidInput(n);
  var m = Math.abs(n);
  var sum = (m * (m + 1)) / 2;
  return n < 0 ? -sum : sum;
};

// 2^27 - 1, the largest n with n(n + 1) / 2 <= Number.MAX_SAFE_INTEGER.
var MAX_N = 134217727;

function assertValidInput(n) {
  if (!Number.isInteger(n)) {
    var received = typeof n === 'number' || n === null ? String(n) : typeof n;
    throw new TypeError('sum_to_n: n must be an integer, received ' + received);
  }
  if (Math.abs(n) > MAX_N) {
    throw new RangeError(
      'sum_to_n: |n| must be at most ' + MAX_N + ' for the sum to be a safe integer, received ' + n
    );
  }
}

// In a browser the functions above are plain globals, as in the template; Node gets CommonJS exports.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sum_to_n_a, sum_to_n_b, sum_to_n_c, MAX_N };
}
