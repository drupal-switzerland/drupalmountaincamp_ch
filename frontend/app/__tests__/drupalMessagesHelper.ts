// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { DrupalMessage } from '../composables/useDrupalMessages'
import { appendNewMessages, extractMessages } from '../helpers/drupalMessages'

type Response = Parameters<typeof extractMessages>[0]

function message(type: string, safe: string) {
  return { type, safe, message: 'raw ' + safe, escaped: 'escaped ' + safe }
}

function response(...messengerMessages: ReturnType<typeof message>[]) {
  return { data: { messengerMessages } } as unknown as Response
}

describe('extractMessages', () => {
  it('reads the type and the sanitised text of every message', () => {
    expect(
      extractMessages(
        response(message('status', 'Saved.'), message('error', '<em>No</em>')),
      ),
    ).toEqual([
      { type: 'status', message: 'Saved.' },
      { type: 'error', message: '<em>No</em>' },
    ])
  })

  it.each([
    ['without data', {}],
    ['with data but no messages field', { data: { route: null } }],
    ['with an empty list', { data: { messengerMessages: [] } }],
  ])('finds nothing in a response %s', (_, data) => {
    expect(extractMessages(data as unknown as Response)).toEqual([])
  })
})

describe('appendNewMessages', () => {
  it('adds the messages and returns them', () => {
    const messages: DrupalMessage[] = []
    const added = appendNewMessages(
      messages,
      response(message('status', 'Saved.'), message('warning', 'Careful.')),
    )

    expect(messages).toEqual([
      { type: 'status', message: 'Saved.' },
      { type: 'warning', message: 'Careful.' },
    ])
    expect(added).toEqual(messages)
  })

  it('returns nothing for a message that is already shown', () => {
    const messages: DrupalMessage[] = [{ type: 'status', message: 'Saved.' }]
    const added = appendNewMessages(
      messages,
      response(message('status', 'Saved.')),
    )

    expect(added).toEqual([])
    expect(messages).toHaveLength(1)
  })

  it('returns only the new ones of a mixed response, in order', () => {
    const messages: DrupalMessage[] = [{ type: 'status', message: 'Saved.' }]
    const added = appendNewMessages(
      messages,
      response(
        message('error', 'Failed.'),
        message('status', 'Saved.'),
        message('warning', 'Careful.'),
      ),
    )

    expect(added.map((v) => v.message)).toEqual(['Failed.', 'Careful.'])
    expect(messages.map((v) => v.message)).toEqual([
      'Saved.',
      'Failed.',
      'Careful.',
    ])
  })

  it('adds a message that one response carries twice only once', () => {
    const messages: DrupalMessage[] = []
    const added = appendNewMessages(
      messages,
      response(message('status', 'Saved.'), message('status', 'Saved.')),
    )

    expect(added).toHaveLength(1)
    expect(messages).toHaveLength(1)
  })

  it('returns nothing for a response without messages', () => {
    const messages: DrupalMessage[] = []

    expect(appendNewMessages(messages, {} as unknown as Response)).toEqual([])
    expect(messages).toEqual([])
  })
})
