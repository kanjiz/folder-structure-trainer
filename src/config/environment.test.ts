import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getEnvironment, createDataSource, isResultSavingEnabled } from './environment'
import { StaticDataSource } from '../services/StaticDataSource'

describe('environment', () => {
  // 環境変数のバックアップ
  let originalEnv: string | undefined

  beforeEach(() => {
    originalEnv = import.meta.env.VITE_ENV
  })

  afterEach(() => {
    // 環境変数を元に戻す
    if (originalEnv !== undefined) {
      import.meta.env.VITE_ENV = originalEnv
    } else {
      delete import.meta.env.VITE_ENV
    }
  })

  describe('getEnvironment', () => {
    it('VITE_ENVが未設定の場合、developmentを返す', () => {
      delete import.meta.env.VITE_ENV
      expect(getEnvironment()).toBe('development')
    })

    it('VITE_ENVがdevelopmentの場合、developmentを返す', () => {
      import.meta.env.VITE_ENV = 'development'
      expect(getEnvironment()).toBe('development')
    })

    it('VITE_ENVがgithub-pagesの場合、github-pagesを返す', () => {
      import.meta.env.VITE_ENV = 'github-pages'
      expect(getEnvironment()).toBe('github-pages')
    })

    it('VITE_ENVがgasの場合、gasを返す', () => {
      import.meta.env.VITE_ENV = 'gas'
      expect(getEnvironment()).toBe('gas')
    })
  })

  describe('createDataSource', () => {
    it('development環境でStaticDataSourceを返す', () => {
      import.meta.env.VITE_ENV = 'development'
      const dataSource = createDataSource()
      expect(dataSource).toBeInstanceOf(StaticDataSource)
    })

    it('github-pages環境でStaticDataSourceを返す', () => {
      import.meta.env.VITE_ENV = 'github-pages'
      const dataSource = createDataSource()
      expect(dataSource).toBeInstanceOf(StaticDataSource)
    })

    // GASDataSourceは将来実装
    // it('gas環境でGASDataSourceを返す', () => {
    //   import.meta.env.VITE_ENV = 'gas'
    //   const dataSource = createDataSource()
    //   expect(dataSource).toBeInstanceOf(GASDataSource)
    // })
  })

  describe('isResultSavingEnabled', () => {
    it('development環境でfalseを返す', () => {
      import.meta.env.VITE_ENV = 'development'
      expect(isResultSavingEnabled()).toBe(false)
    })

    it('github-pages環境でfalseを返す', () => {
      import.meta.env.VITE_ENV = 'github-pages'
      expect(isResultSavingEnabled()).toBe(false)
    })

    it('gas環境でtrueを返す', () => {
      import.meta.env.VITE_ENV = 'gas'
      expect(isResultSavingEnabled()).toBe(true)
    })
  })
})
