import { describe, expect, it } from 'vitest'
import drupalUserPlugin from '../plugins/drupalUser'
import graphqlPlugin from '../plugins/graphqlMiddleware'

type NamedPlugin = { _name?: string; dependsOn?: string[] }

// The user query selects messengerMessages, and Drupal hands messages out
// once. The GraphQL plugin is what collects them from a response (and adds
// the language and build id to the request), so it has to be set up first.
// Vitest cannot run the plugins in a production build's order; this pins the
// declaration that makes Nuxt order them.
describe('Drupal user plugin', () => {
  it('runs after the plugin that collects messages from GraphQL responses', () => {
    const collector = (graphqlPlugin as NamedPlugin)._name

    expect(collector).toBeTruthy()
    expect((drupalUserPlugin as NamedPlugin).dependsOn).toContain(collector)
  })
})
