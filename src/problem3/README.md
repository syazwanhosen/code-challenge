# Problem 3: Messy React

`WalletPage` is meant to list the wallet's balances on supported chains, highest-priority chain first, each with its USD value. As written it doesn't compile: under `strict`, TypeScript reports seven errors. Patch it just enough to run, and it lists the wrong balances.

Here is a sample wallet run through both versions. ATOM is on Cosmos, which isn't a supported chain, and NEO and ARB have no price.

| | Original, patched to run | Refactored |
| --- | --- | --- |
| Balances listed | OSMO 0, NEO 0 | ETH 1.5, ARB 0.25, ZIL 250.75 |
| `formattedAmount` | `undefined` | `"1.5"`, `"0.25"`, `"250.75"` |
| USD value without a price | `NaN` | `0` |
| Row keys | `0`, `1` | `Ethereum:ETH`, `Arbitrum:ARB`, `Zilliqa:ZIL` |

## Issues

Ordered by impact. The TypeScript error codes come from compiling the original snippet under `strict`.

### Bugs

**1. `lhsPriority` is never defined.** The filter computes `balancePriority`, then tests a different name:

```ts
const balancePriority = getPriority(balance.blockchain);
if (lhsPriority > -99) {
```

TypeScript rejects it (TS2304). Shipped as plain JavaScript, it would throw a `ReferenceError` on the first balance and take the component down with it. *Fix:* test the value that was just computed.

**2. The filter keeps exactly the wrong balances.** `if (balance.amount <= 0) return true` keeps empty and negative balances and drops everything the user actually holds. That's why the sample wallet lists only OSMO and NEO. *Fix:* keep balances where `amount > 0`.

**3. `WalletBalance` has no `blockchain` field.** Every `balance.blockchain` is a type error (TS2339): the code depends on a field its own type says doesn't exist. *Fix:* add `blockchain: string` to the interface.

**4. The rows are built from the wrong array.** `formattedBalances` is computed and then ignored, because `rows` maps over `sortedBalances`, so `balance.formatted` is always `undefined`. The callback's `FormattedWalletBalance` annotation claims a field the data doesn't have, and strict mode rejects it (TS2345: `formatted` is missing). *Fix:* format each amount where its row is built, and drop the extra array.

**5. `classes` is never defined.** `className={classes.row}` is TS2304, and a `ReferenceError` at runtime. *Fix:* define it, for example with a CSS module import or a `useStyles()` hook.

**6. A missing price makes the USD value `NaN`.** For a token without a price, `prices[balance.currency] * balance.amount` is `undefined * amount`. *Fix:* handle the missing price explicitly. The refactor uses `?? 0`; letting `WalletRow` show "—" would be better still.

**7. `toFixed()` rounds to whole numbers.** Without an argument it keeps no decimals, so 0.25 becomes `"0"` and 1.5 becomes `"2"`. *Fix:* pass a precision, or better, use one shared `Intl.NumberFormat`, which adds thousands separators too.

**8. The sort comparator has no case for ties.** It returns `-1` or `1`, and `undefined` when two priorities are equal, which does happen: Zilliqa and Neo are both 20. Strict TypeScript rejects the comparator (TS2345, plus TS7030 "Not all code paths return a value" with `noImplicitReturns`). At runtime the engine converts `undefined` to `NaN` and treats it as "equal", so it only works by accident. *Fix:* `(a, b) => b.priority - a.priority` handles all three cases.

**9. Box props are spread onto a plain `<div>`.** `Props` extends `BoxProps`, but `rest` lands on a `div`, where Box-only props mean nothing. They become junk DOM attributes such as `sx="[object Object]"` and `p="2"`, and React warns only about camelCase ones like `flexDirection`. *Fix:* render `<Box {...rest}>`.

**10. `children` is accepted and silently dropped.** It's destructured and never rendered, so anything passed between the tags disappears. *Fix:* render it, or remove it from the props type so passing it becomes a type error. The refactor does the latter, since the page renders its own rows.

### Computational inefficiencies

**11. Every price update re-filters and re-sorts.** The `useMemo` lists `prices` as a dependency but never reads it, and ESLint's `react-hooks/exhaustive-deps` reports it as unnecessary. So the O(n log n) sort reruns whenever prices change, which is typically far more often than balances. *Fix:* depend on `balances` only, and work out USD values separately.

**12. Priorities are looked up inside the sort.** The comparator calls `getPriority` twice per comparison: about 2·n·log n lookups, on top of the n in the filter. *Fix:* look each priority up once, sort on the stored value, then drop it.

**13. An unused copy of the list is built on every render.** `formattedBalances` sits outside the memo, so every render allocates a full copy of the list that nothing reads. *Fix:* remove it (see 4).

**14. `getPriority` is recreated on every render.** It's a pure function that uses nothing from props or state, but because it's defined inside the component, each render creates a new copy. *Fix:* move it to module scope. Written as a lookup table, it also keeps the priorities in one place.

### React anti-patterns and maintainability

**15. Array indexes are used as keys.** The list is filtered and sorted, so a row's index changes whenever a balance appears, disappears or moves. React ties DOM nodes and state to the key, so they stay with the position rather than the balance: state lands on the wrong row, and every row after the change re-renders with new props. *Fix:* use a stable identity such as `` `${blockchain}:${currency}` ``.

**16. `any` and magic numbers.** `blockchain: any` switches off type checking for `getPriority`'s callers. `-99` is a sentinel the filter has to know about, and the priorities are buried in a `switch`. *Fix:* use a lookup table (`as const satisfies Record<string, number>`) and return `undefined` for unsupported chains. If the API's chain names are known, typing them as a union also turns a typo or a missing chain into a compile error.

**17. Redundant and duplicated types.** `React.FC<Props> = (props: Props)` annotates the props twice. `interface Props extends BoxProps {}` is an empty interface where a type alias would do. `FormattedWalletBalance` repeats `WalletBalance`'s fields instead of extending it.

**18. Nested `if`s for a single condition.** The filter's nested branches and `return true` / `return false` collapse into one boolean expression, which is easier to read and harder to invert by accident (see 2).

### Looks wrong, but isn't

`.sort()` sorts in place, but here it sorts the new array that `.filter()` returns, so the hook's data isn't mutated. Remove the filter and it would be; `toSorted()`, or sorting a copy, avoids that trap.

## Refactored version

The logic moves out of the component into plain, testable functions in [walletBalances.ts](walletBalances.ts): the priority table, filtering and sorting, amount formatting, and USD values. What's left in [WalletPage.tsx](WalletPage.tsx) is hooks and rendering:

```tsx
type WalletPageProps = Omit<BoxProps, 'children'>

export function WalletPage(props: WalletPageProps) {
  const balances = useWalletBalances()
  const prices = usePrices()

  // Filtering and sorting don't involve prices, so a price update doesn't redo them.
  const visibleBalances = useMemo(() => selectVisibleBalances(balances), [balances])

  return (
    <Box {...props}>
      {visibleBalances.map((balance) => (
        <WalletRow
          key={`${balance.blockchain}:${balance.currency}`}
          className={classes.row}
          amount={balance.amount}
          usdValue={usdValueOf(balance, prices)}
          formattedAmount={formatAmount(balance.amount)}
        />
      ))}
    </Box>
  )
}
```

It rests on a few assumptions:

- `useWalletBalances`, `usePrices` and `WalletRow` come from the app, and their import paths are placeholders.
- `classes` comes from a CSS module.
- `WalletRow` takes `usdValue` as a number, which is why a missing price becomes `0`.

The memo only pays off if `useWalletBalances` returns the same array until the balances change.

## Checking it

The extracted logic has tests that need no install (Node 22.6+):

```sh
node --test --experimental-strip-types src/problem3/walletBalances.test.ts
```

I also type-checked the refactor under `strict` with `noUncheckedIndexedAccess`, and rendered it with React against stand-ins for the hooks and `WalletRow`. It lists ETH, ARB and ZIL from the sample wallet and logs no warnings.
