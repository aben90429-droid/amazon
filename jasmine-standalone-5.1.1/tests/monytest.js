import { formatcurrency } from "../../scripts/uitils/money.js";



console.log('easssy')
if (formatcurrency(2095) === '20.95') {
  console.log('passend')

} else {
  console.log('failed')
}
console.log('works with 0')
if (
  formatcurrency(0) === '0.00'
) {
  console.log('passend')
} else {
  console.log('failed')
}
console.log('hellp')
if (formatcurrency(2000.5) === '20.01') {
  console.log('yes')
} else {
  console.log(':(')
}
if (formatcurrency(2000.4) === '20.00') {
  console.log(':)')
} else {
  console.log(':(')
}