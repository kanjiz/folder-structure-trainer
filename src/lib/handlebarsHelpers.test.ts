// src/lib/handlebarsHelpers.test.ts
import { describe, it, expect } from 'vitest'
import Handlebars from 'handlebars'
import { registerHandlebarsHelpers } from './handlebarsHelpers'

describe('registerHandlebarsHelpers', () => {
  it('eqヘルパーが登録される', () => {
    registerHandlebarsHelpers()
    expect(Handlebars.helpers.eq).toBeDefined()
  })

  it('eqヘルパーは同じ値に対してtrueを返す', () => {
    registerHandlebarsHelpers()
    const template = Handlebars.compile('{{#if (eq type "folder")}}folder{{else}}file{{/if}}')
    const result = template({ type: 'folder' })
    expect(result).toBe('folder')
  })

  it('eqヘルパーは異なる値に対してfalseを返す', () => {
    registerHandlebarsHelpers()
    const template = Handlebars.compile('{{#if (eq type "folder")}}folder{{else}}file{{/if}}')
    const result = template({ type: 'file' })
    expect(result).toBe('file')
  })
})
