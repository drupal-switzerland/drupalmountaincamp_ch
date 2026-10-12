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

function hasBalancedParentheses(value: string): boolean {
  let depth = 0
  for (const char of value) {
    if (char === '(') {
      depth++
    } else if (char === ')' && --depth < 0) {
      return false
    }
  }
  return depth === 0
}

/** A plain length, or a calc() whose + and - have a space on both sides. */
function isWidth(value: string): boolean {
  if (LENGTH.test(value)) {
    return true
  }
  if (!value.startsWith('calc(') || !hasBalancedParentheses(value)) {
    return false
  }
  const terms = value
    .replace(/calc\(|[()]/g, ' ')
    .split(/ +/)
    .filter(Boolean)
  return terms.every(
    (term) =>
      ['+', '-', '*', '/'].includes(term) || /^\d+(\.\d+)?[a-z]*$/.test(term),
  )
}

/**
 * Why a `sizes` value would not be read as written, or [] when it is fine.
 * A browser drops an entry it cannot parse and falls back to 100vw without
 * any error, so a typo only shows as a larger download.
 *
 * Structural only: the forms this project writes (min-width conditions in
 * px or rem; px, rem or vw lengths; calc() without nested functions). A real
 * browser has the last word; the measurement script parses each value there.
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
