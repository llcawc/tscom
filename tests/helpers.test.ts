import { glob } from 'glob'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { defineOptions, getFiles } from '../src/tscom'

// Мокируем glob для тестов getFiles
vi.mock('glob', () => ({
  glob: vi.fn(),
}))

describe('defineOptions', () => {
  it('should return inputOptions and outputOptions with defaults', () => {
    const result = defineOptions({
      filename: 'src/app.js',
    })

    expect(result.inputOptions).toEqual({
      input: 'src/app.js',
    })
    expect(result.outputOptions).toEqual({
      dir: 'dist',
      format: 'esm',
      sourcemap: false,
      minify: 'dce-only',
    })
  })

  it('should override defaults', () => {
    const result = defineOptions({
      filename: 'src/app.ts',
      dir: 'out',
      format: 'es',
      minify: true,
      sourcemap: 'inline',
    })

    expect(result.inputOptions).toEqual({
      input: 'src/app.ts',
    })
    expect(result.outputOptions).toEqual({
      dir: 'out',
      format: 'es',
      sourcemap: 'inline',
      minify: true,
    })
  })

  it('should handle minify as false', () => {
    const result = defineOptions({
      filename: 'src/app.js',
      minify: false,
    })
    expect(result.outputOptions.minify).toBe(false)
  })

  it('should handle sourcemap as hidden', () => {
    const result = defineOptions({
      filename: 'src/app.js',
      sourcemap: 'hidden',
    })
    expect(result.outputOptions.sourcemap).toBe('hidden')
  })
})

describe('getFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call glob with string pattern', async () => {
    ;(glob as any).mockResolvedValue(['src/a.js', 'src/b.js'])
    const result = await getFiles('src/*.js')
    expect(glob).toHaveBeenCalledWith('src/*.js', { ignore: undefined })
    expect(result).toEqual(['src/a.js', 'src/b.js'])
  })

  it('should call glob with array pattern', async () => {
    ;(glob as any).mockResolvedValue(['src/a.js'])
    const result = await getFiles(['src/*.js', 'src/*.ts'])
    expect(glob).toHaveBeenCalledWith(['src/*.js', 'src/*.ts'], { ignore: undefined })
    expect(result).toEqual(['src/a.js'])
  })

  it('should separate ignore patterns', async () => {
    ;(glob as any).mockResolvedValue(['src/a.js'])
    const result = await getFiles(['src/*.js', '!src/excluded.js', '!src/another.ts'])
    // Положительные паттерны: только те, что без !
    expect(glob).toHaveBeenCalledWith(['src/*.js'], { ignore: ['src/excluded.js', 'src/another.ts'] })
    expect(result).toEqual(['src/a.js'])
  })

  it('should handle only ignore patterns', async () => {
    ;(glob as any).mockResolvedValue([])
    const result = await getFiles(['!src/excluded.js'])
    // Положительных паттернов нет, patterns = []
    expect(glob).toHaveBeenCalledWith([], { ignore: ['src/excluded.js'] })
    expect(result).toEqual([])
  })

  it('should handle empty array', async () => {
    ;(glob as any).mockResolvedValue([])
    const result = await getFiles([])
    expect(glob).toHaveBeenCalledWith([], { ignore: undefined })
    expect(result).toEqual([])
  })

  it('should propagate glob errors', async () => {
    ;(glob as any).mockRejectedValue(new Error('glob error'))
    await expect(getFiles('src/*.js')).rejects.toThrow('glob error')
  })
})
