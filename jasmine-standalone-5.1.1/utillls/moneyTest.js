import { formatcurrency } from "../../scripts/uitils/money.js";

describe('test suite: formatcurrency', () => {
  it('convert monye', () => {
    expect(formatcurrency(2095)).toEqual('20.95')
  })
  it('works with zero', () => {
    expect(formatcurrency(0)).toEqual('0.00')
  })
  it('idk', () => {
    expect(formatcurrency(2000.4)).toEqual('20.00')
  })
})