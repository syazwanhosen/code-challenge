# Problem 2: Fancy Form

A currency swap form built with **Vite, React and TypeScript**. Pick two tokens and type an amount on either side; the other side updates at the latest price. Swaps go to a mocked backend, and the demo wallet's balances update when they complete.

<p>
  <img src="docs/swap-form.png" alt="Swap form converting 0.75 ETH to USDC" width="49%">
  <img src="docs/token-picker.png" alt="Token picker with search, popular tokens, prices and balances" width="49%">
</p>

## Running it

Requires Node 20.19+ or 22.12+.

```sh
cd src/problem2
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm test` | Unit and component tests (Vitest and Testing Library) |
| `npm run build` | Type-checks, then builds to `dist/` with relative paths, so it can be served from any sub-path |
| `npm run preview` | Serves the production build |
| `npm run lint` | Lints with oxlint |

The provided `index.html`, `script.js` and `style.css` were replaced by the Vite app, which the task allows.

## What it does

- **Amounts in both directions.** Type what you pay or what you want to receive, and the other side is computed. Flipping the sides keeps your typed amount with its token.
- **Token picker.** Search by symbol, one-click popular tokens, and your holdings listed first by value, with prices and balances. It works from the keyboard (↑/↓, Enter, Esc) and becomes a bottom sheet on phones.
- **Validation as you type.** Only numbers get in: a comma works as the decimal point, and a pasted `1,234.5` is cleaned up. An amount above your balance, or one too small to produce anything on the other side, is flagged next to the field. The button always says what's missing instead of failing on click.
- **A demo wallet.** Balances and a Max button give the validation something real to check against.
- **Mocked backend.** Submitting shows a loading state for about 1.5 seconds, then a confirmation toast. If the request fails, an error toast appears and your amount is kept.
- **Loading and failure states.** Skeletons show while prices load, with a retry if they don't arrive.

<img src="docs/mobile.png" alt="Mobile layout flagging an amount above the balance" width="300">

## Decisions worth knowing

- **The price feed is cleaned on arrival.** It lists some currencies more than once (BUSD, USDC), sometimes with the same timestamp and different prices. The most recent entry wins, and on a tie the later one in the feed does. Entries without a usable price are dropped. Five upper-cased symbols such as `STATOM` get their usual casing back (`stATOM`), because the icon repo uses it and the upper-case URLs return 404.
- **Exact decimal maths.** Amounts and balances are decimal strings handled with [big.js](https://github.com/MikeMcl/big.js), so `0.1 + 0.2` is `0.3` and pressing Max never trips the balance check.
- **Rounding never favours the user.** A computed receive amount rounds down and a computed pay amount rounds up, as an exchange would.
- **Accessibility.** Fields are labelled and errors are tied to them with `aria-describedby`. The picker is a native `<dialog>`, which traps focus and hands it back on close. Results are announced through live regions, and reduced-motion settings are respected. An axe-core scan of every state in Chrome reports no violations, including colour contrast.
- **No UI kit.** The styling is hand-written CSS Modules on a small set of design tokens, in a dark theme set in Inter.

## Project structure

```
src/
  api/          price feed (fetch and clean-up) and the mocked swap endpoint
  swap/         form state (reducer and quote), token search, demo wallet
  lib/          amount parsing and rounding, number formatting
  hooks/        useTokens: loading, error and retry for the price feed
  components/   SwapForm, AmountPanel, TokenPicker, RateLine, Toast, TokenIcon
```

The logic in `api/`, `swap/` and `lib/` is plain TypeScript with its own unit tests, which keeps the components thin. `SwapForm.test.tsx` drives the whole form the way a user would, from typing and flipping to keyboard picking and submitting.
