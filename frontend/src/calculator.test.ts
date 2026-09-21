import { describe, expect, it } from 'vitest'
import { resultToExpression, repeatOperation } from './calculator'

describe('repeatOperation', () => {
  it.each([
    ['2 + 3', ' + (3)'],
    ['10 / 2', ' / (2)'],
    ['2 * -3', ' * (-3)'],
    ['3 + 5 * 2', ' + (5 * 2)'],
    ['(2 + 3)', ' + (3)'],
    ['2 ^ 3 ^ 2', ' ^ (3 ^ 2)'],
    ['sqrt(9)', null],
    ['5', null],
  ])('finds the final operation in %s', (expression, expected) => {
    expect(repeatOperation(expression)).toBe(expected)
  })
})

describe('resultToExpression', () => {
  it.each([
    [5, '5'],
    [0, '0'],
    [-2, '(-2)'],
    [1 / 3, '0.3333333333333333'],
    [1e-7, '0.0000001'],
    [-1.25e-7, '(-0.000000125)'],
    [1e21, '1000000000000000000000'],
    [Number.MIN_VALUE, '0.' + '0'.repeat(323) + '5'],
  ])('writes %s as a value the parser can read', (result, expression) => {
    expect(resultToExpression(result)).toBe(expression)
  })
})
