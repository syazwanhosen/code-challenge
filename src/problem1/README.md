# Problem 1: Three ways to sum to n

[`index.js`](index.js) has three independent implementations of `sum_to_n`, from slowest to fastest:

| Function | Approach | Time | Space |
| --- | --- | --- | --- |
| `sum_to_n_a` | Iterative loop: `1 + 2 + … + n` | O(n) | O(1) |
| `sum_to_n_b` | Recursive divide and conquer: `S(2k) = 2·S(k) + k²` | O(log n) | O(log n) stack |
| `sum_to_n_c` | Closed form (Gauss): `n(n + 1) / 2` | O(1) | O(1) |

Use `sum_to_n_c` in practice. `a` and `b` are there to show the trade-offs.

## Behaviour

The three functions follow the same contract and return identical results:

- `sum_to_n(5) === 15` and `sum_to_n(0) === 0`.
- **Negative n** mirrors the positive case: `sum_to_n(-5) === -1 - 2 - 3 - 4 - 5 === -15`. The spec allows any integer, so negative inputs get a real answer instead of 0 or an error.
- **Valid range** is `|n| ≤ 134,217,727` (2²⁷ − 1), the largest n whose sum stays within `Number.MAX_SAFE_INTEGER`. Results are exact across the whole range, including both ends.
- **Invalid input throws** instead of returning a wrong number: a `TypeError` for non-integers (`2.5`, `NaN`, `Infinity`, `'5'`, `null`) and a `RangeError` for integers outside the valid range.

## Pitfalls avoided

- **Naive recursion** (`n + sum(n - 1)`) overflows the call stack around n = 11,000 in Node 22, well inside the valid range. `sum_to_n_b` halves n on every call, so it never recurses more than 27 calls deep.
- **`Array.from({ length: n }).reduce(...)`** builds the whole range in memory first. At the top of the range that takes ~1 GB and ~14 s, against ~0.2 s for the plain loop.
- **`n * (n + 1)` overflowing.** Near the top of the range the product does exceed `MAX_SAFE_INTEGER`, but it stays exact: it is always even and below 2⁵⁴, and doubles represent every even integer below 2⁵⁴ exactly. The boundary tests confirm it.
- **Unvalidated input.** In a naive loop, `Infinity` never terminates and freezes the page. In the naive formula, `'5'` returns `127.5`, because `'5' + 1` is `'51'`. Here both throw.

## Running

The functions are plain globals, as in the template, so `index.js` works pasted into a browser console or loaded with a `<script>` tag. Node can also `require()` it.

The tests use Node's built-in test runner and need no install. They cover the spec example, negatives, both ends of the valid range, invalid input, and a cross-check of all three against an exact BigInt reference:

```sh
node --test src/problem1/index.test.js
```
