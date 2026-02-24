// src/lib/handlebarsHelpers.spec.ts
import { describe, it, expect } from 'vitest'
import Handlebars from 'handlebars'
import { registerHandlebarsHelpers } from './handlebarsHelpers'

describe('registerHandlebarsHelpers', () => {
  it('should register eq helper', () => {
    registerHandlebarsHelpers()
    expect(Handlebars.helpers.eq).toBeDefined()
  })

  it('eq helper should return true for equal values', () => {
    registerHandlebarsHelpers()
    const template = Handlebars.compile('{{#if (eq type "folder")}}folder{{else}}file{{/if}}')
    const result = template({ type: 'folder' })
    expect(result).toBe('folder')
  })

  it('eq helper should return false for different values', () => {
    registerHandlebarsHelpers()
    const template = Handlebars.compile('{{#if (eq type "folder")}}folder{{else}}file{{/if}}')
    const result = template({ type: 'file' })
    expect(result).toBe('file')
  })
})
