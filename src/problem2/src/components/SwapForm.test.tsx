import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { submitSwap } from '../api/swap.ts'
import { PRICE_FEED, stubFetch } from '../test/fixtures.ts'

vi.mock('../api/swap.ts', () => ({ submitSwap: vi.fn() }))

const payTokenButton = (symbol: string) => screen.getByRole('button', { name: `${symbol}, change token to pay with` })
const receiveTokenButton = (symbol: string) =>
  screen.getByRole('button', { name: `${symbol}, change token to receive` })

async function renderApp() {
  const user = userEvent.setup()
  render(<App />)
  await screen.findByRole('button', { name: 'ETH, change token to pay with' })
  return { user, pay: screen.getByLabelText('You pay'), receive: screen.getByLabelText('You receive') }
}

describe('swap form', () => {
  beforeEach(() => {
    stubFetch(PRICE_FEED)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('loads prices, then starts on ETH → USDC', async () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Loading prices…' })).toHaveAttribute('aria-disabled', 'true')

    expect(await screen.findByRole('button', { name: 'ETH, change token to pay with' })).toBeInTheDocument()
    expect(receiveTokenButton('USDC')).toBeInTheDocument()
    expect(screen.getByText('1 ETH = 2,000 USDC')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enter an amount' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('converts what you pay into what you receive', async () => {
    const { user, pay, receive } = await renderApp()
    await user.type(pay, '0.5')

    expect(receive).toHaveValue('1000')
    expect(screen.getAllByText('≈ $1,000.00')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Confirm swap' })).not.toHaveAttribute('aria-disabled')
  })

  it('works backwards from the amount you want to receive', async () => {
    const { user, pay, receive } = await renderApp()
    await user.type(receive, '100')

    expect(pay).toHaveValue('0.05')
  })

  it('ignores keystrokes that are not part of a number', async () => {
    const { user, pay } = await renderApp()
    await user.type(pay, '1a.2b,3')

    expect(pay).toHaveValue('1.23')
  })

  it('keeps each amount with its token when the sides flip', async () => {
    const { user, pay, receive } = await renderApp()
    await user.type(pay, '0.5')
    await user.click(screen.getByRole('button', { name: 'Switch tokens' }))

    expect(payTokenButton('USDC')).toBeInTheDocument()
    expect(receiveTokenButton('ETH')).toBeInTheDocument()
    expect(receive).toHaveValue('0.5')
    expect(pay).toHaveValue('1000')
  })

  it('blocks amounts above the balance and offers the maximum instead', async () => {
    const { user, pay } = await renderApp()
    await user.type(pay, '2')

    expect(pay).toHaveAttribute('aria-invalid', 'true')
    expect(pay).toHaveAccessibleDescription('Exceeds your balance')
    await user.click(screen.getByRole('button', { name: 'Insufficient ETH balance' }))
    expect(submitSwap).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Max, use your whole ETH balance' }))
    expect(pay).toHaveValue('1.8642')
    expect(pay).not.toHaveAttribute('aria-invalid')
    expect(screen.getByRole('button', { name: 'Confirm swap' })).toBeInTheDocument()
  })

  it('sends you to the amount field if you press the button too early', async () => {
    const { user, pay } = await renderApp()
    await user.click(screen.getByRole('button', { name: 'Enter an amount' }))

    expect(pay).toHaveFocus()
  })

  it('picks a token from a searchable list with the keyboard', async () => {
    const { user } = await renderApp()
    await user.click(payTokenButton('ETH'))

    const dialog = screen.getByRole('dialog', { name: 'Select a token' })
    const search = within(dialog).getByRole('combobox', { name: 'Search tokens' })
    expect(search).toHaveFocus()

    await user.type(search, 'atom')
    const options = within(dialog).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      expect.stringMatching(/^ATOM/),
      expect.stringMatching(/^stATOM/),
    ])

    await user.keyboard('{ArrowDown}{Enter}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(payTokenButton('stATOM')).toHaveFocus()
  })

  it('swaps the sides when you pick the token from the other side', async () => {
    const { user } = await renderApp()
    await user.click(receiveTokenButton('USDC'))
    await user.click(within(screen.getByRole('dialog')).getByRole('option', { name: /^ETH/ }))

    expect(payTokenButton('USDC')).toBeInTheDocument()
    expect(receiveTokenButton('ETH')).toBeInTheDocument()
  })

  it('closes the token list on Escape without changing anything', async () => {
    const { user } = await renderApp()
    await user.click(payTokenButton('ETH'))
    // Browsers turn Escape into a cancel event on modal dialogs; jsdom doesn't.
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(payTokenButton('ETH')).toHaveFocus()
  })

  it('submits the swap, then updates the balances and confirms', async () => {
    let finish = () => {}
    vi.mocked(submitSwap).mockImplementation(
      (request) =>
        new Promise((resolve) => {
          finish = () => resolve(request)
        }),
    )
    const { user, pay, receive } = await renderApp()
    await user.type(pay, '0.5')
    await user.click(screen.getByRole('button', { name: 'Confirm swap' }))

    expect(submitSwap).toHaveBeenCalledWith({ from: 'ETH', to: 'USDC', amountIn: '0.5', amountOut: '1000' })
    expect(screen.getByRole('button', { name: 'Swapping…' })).toHaveAttribute('aria-disabled', 'true')
    expect(pay).toBeDisabled()

    await act(async () => finish())
    expect(screen.getByRole('status')).toHaveTextContent('Swap completeSwapped 0.5 ETH for 1,000 USDC.')
    expect(pay).toHaveValue('')
    expect(receive).toHaveValue('')
    expect(screen.getByText(/Balance: 1\.3642/)).toBeInTheDocument()
    expect(screen.getByText(/Balance: 3,450\.75/)).toBeInTheDocument()
  })

  it('reports a failed swap and keeps the amount for another try', async () => {
    vi.mocked(submitSwap).mockRejectedValue(new Error('Network error'))
    const { user, pay } = await renderApp()
    await user.type(pay, '0.5')
    await user.click(screen.getByRole('button', { name: 'Confirm swap' }))

    expect(await screen.findByText('Swap failed')).toBeInTheDocument()
    expect(pay).toHaveValue('0.5')
    expect(screen.getByText(/Balance: 1\.8642/)).toBeInTheDocument()
  })

  it('offers a retry when prices fail to load', async () => {
    const fetchMock = stubFetch('offline', PRICE_FEED)
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load token prices.')
    expect(screen.getByRole('button', { name: 'Prices unavailable' })).toHaveAttribute('aria-disabled', 'true')

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('button', { name: 'ETH, change token to pay with' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
