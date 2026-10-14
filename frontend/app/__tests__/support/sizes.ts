const CONDITION = /^\(min-width: \d+(\.\d+)?(px|rem)\)$/
const LENGTH = /^\d+(\.\d+)?(px|rem|vw)$/

function splitAtTopLevelCommas(value: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let index = 0; index < value.length; index++) {
    if (value[index] === '(') {
      depth++
    } else if (value[index] === ')') {
      depth--
    } else if (value[index] === ',' && depth === 0) {
      parts.push(value.slice(start, index).trim())
      start = index + 1
    }
  }
  parts.push(value.slice(start).trim())
  return parts
}

type Kind = 'length' | 'number'
type Token = Kind | '+' | '-' | '*' | '/' | '(' | ')'

const CALC_TOKEN = /\s*(?:(\d+(?:\.\d+)?)([a-z]*)|([-+*/()]))/y
const LENGTH_UNITS = ['px', 'rem', 'vw']

function valueKind(unit: string): Kind | undefined {
  if (unit === '') {
    return 'number'
  }
  return LENGTH_UNITS.includes(unit) ? 'length' : undefined
}

/** The tokens of a calc() body, or undefined when it has a part CSS rejects. */
function calcTokens(body: string): Token[] | undefined {
  const tokens: Token[] = []
  CALC_TOKEN.lastIndex = 0
  while (CALC_TOKEN.lastIndex < body.trimEnd().length) {
    const start = CALC_TOKEN.lastIndex
    const match = CALC_TOKEN.exec(body)
    if (!match) {
      return undefined
    }
    const [text, number, unit = '', symbol] = match
    const token = number === undefined ? (symbol as Token) : valueKind(unit)
    const end = start + text.length
    // CSS reads + and - as operators only with white space on both sides.
    const isSpaced = /\s/.test(text[0] ?? '') && /\s/.test(body[end] ?? '')
    if (!token || ((token === '+' || token === '-') && !isSpaced)) {
      return undefined
    }
    tokens.push(token)
  }
  return tokens
}

/**
 * The kind of value a calc() body gives, by the type rules of CSS: sums need
 * two operands of one kind, a product at most one length, a division a plain
 * number on the right.
 */
function calcKind(tokens: Token[]): Kind | undefined {
  let position = 0
  const take = () => tokens[position++]
  const peek = () => tokens[position]

  function operand(): Kind | undefined {
    const token = take()
    if (token !== '(') {
      return token === 'length' || token === 'number' ? token : undefined
    }
    const inner = sum()
    return take() === ')' ? inner : undefined
  }

  function product(): Kind | undefined {
    let left = operand()
    while (left && (peek() === '*' || peek() === '/')) {
      const operator = take()
      const right = operand()
      if (operator === '/') {
        left = right === 'number' ? left : undefined
      } else if (!right || (left === 'length' && right === 'length')) {
        left = undefined
      } else {
        left = left === 'length' ? left : right
      }
    }
    return left
  }

  function sum(): Kind | undefined {
    let left = product()
    while (left && (peek() === '+' || peek() === '-')) {
      take()
      left = product() === left ? left : undefined
    }
    return left
  }

  const kind = sum()
  return position === tokens.length ? kind : undefined
}

/** A plain length, or a calc() that CSS reads as a length. */
function isWidth(value: string): boolean {
  if (LENGTH.test(value)) {
    return true
  }
  if (!value.startsWith('calc(') || !value.endsWith(')')) {
    return false
  }
  const tokens = calcTokens(value.slice('calc('.length, -1))
  return tokens !== undefined && calcKind(tokens) === 'length'
}

/**
 * Why a `sizes` value would not be read as written, or [] when it is fine.
 * A browser drops an entry it cannot parse and falls back to 100vw without
 * any error, so a typo only shows as a larger download.
 *
 * Covers the forms this project writes: min-width conditions in px or rem;
 * px, rem or vw lengths; calc() of those without nested functions or signed
 * numbers. Anything else is reported, also where a browser would accept it.
 */
export function sizesProblems(sizes: string): string[] {
  const entries = splitAtTopLevelCommas(sizes)
  const problems: string[] = []
  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1
    const conditionEnd = entry.startsWith('(') ? entry.indexOf(') ') + 1 : 0
    const condition = entry.slice(0, conditionEnd)
    const width = entry.slice(conditionEnd).trim()
    if (isLast && condition) {
      problems.push(`the last entry has a condition: "${entry}"`)
    }
    if (!isLast && !CONDITION.test(condition)) {
      problems.push(`not a min-width condition: "${entry}"`)
    }
    if (!isWidth(width)) {
      problems.push(`not a width: "${width}"`)
    }
  })
  return problems
}
