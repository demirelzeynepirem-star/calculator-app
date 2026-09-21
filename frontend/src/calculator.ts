export const MAX_EXPRESSION_LENGTH = 500
export const RESULT_DISPLAY_DIGITS = 12

export function repeatOperation(expression: string): string | null {
  const input = expression.trim()
  let depth = 0
  if (input.startsWith('(')) {
    for (let index = 0; index < input.length; index++) {
      if (input[index] === '(') depth++
      if (input[index] === ')') depth--
      if (depth === 0) {
        if (index === input.length - 1) return repeatOperation(input.slice(1, -1))
        break
      }
    }
  }

  depth = 0
  let operatorIndex = -1
  let lowestPriority = Infinity
  let previous = ''
  for (let index = 0; index < input.length; index++) {
    const character = input[index]
    if (/\s/.test(character)) continue
    if (character === '(') depth++
    if (character === ')') depth--
    // A sign after another operator belongs to the next number.
    if (depth === 0 && '+-*/^'.includes(character) && /[\d.)%]/.test(previous)) {
      const priority = '+-'.includes(character) ? 1 : '*/'.includes(character) ? 2 : 3
      if (priority < lowestPriority || (priority === lowestPriority && character !== '^')) {
        lowestPriority = priority
        operatorIndex = index
      }
    }
    previous = character
  }
  if (operatorIndex < 0) return null
  return ' ' + input[operatorIndex] + ' (' + input.slice(operatorIndex + 1).trim() + ')'
}

export interface CalculatorKey {
  label: string
  value: string
  kind?: 'utility' | 'operator' | 'equals'
}

export const calculatorKeys: CalculatorKey[] = [
  { label: 'C', value: 'clear', kind: 'utility' },
  { label: '(', value: '(' },
  { label: ')', value: ')' },
  { label: '÷', value: ' / ', kind: 'operator' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '×', value: ' * ', kind: 'operator' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '−', value: ' - ', kind: 'operator' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '+', value: ' + ', kind: 'operator' },
  { label: '√', value: 'sqrt(' },
  { label: '0', value: '0' },
  { label: '.', value: '.' },
  { label: '^', value: ' ^ ', kind: 'operator' },
  { label: '%', value: '%' },
  { label: '⌫', value: 'backspace', kind: 'utility' },
  { label: '=', value: 'submit', kind: 'equals' },
]

export function resultToExpression(result: number): string {
  // The API reads decimal numbers, so write scientific notation as a decimal.
  const [coefficient, exponent] = String(Math.abs(result)).split('e')
  let decimal = coefficient

  if (exponent !== undefined) {
    const [whole, fraction = ''] = coefficient.split('.')
    const digits = whole + fraction
    const decimalPosition = whole.length + Number(exponent)
    if (decimalPosition <= 0) {
      decimal = '0.' + '0'.repeat(-decimalPosition) + digits
    } else if (decimalPosition >= digits.length) {
      decimal = digits + '0'.repeat(decimalPosition - digits.length)
    } else {
      decimal =
        digits.slice(0, decimalPosition) + '.' + digits.slice(decimalPosition)
    }
  }

  // Brackets keep a negative result correct when the next operation is a power.
  return result < 0 ? '(-' + decimal + ')' : decimal
}
