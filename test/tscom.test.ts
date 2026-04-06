import type File from 'vinyl'

import { describe, it, expect, vi, beforeEach } from 'vitest'

import { tscom } from '../src/tscom'

// Мокируем rolldown
vi.mock('rolldown', () => ({
  rolldown: vi.fn(),
}))

import { rolldown } from 'rolldown'

describe('tscom', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return a Transform stream', () => {
    const plugin = tscom()
    expect(plugin).toBeDefined()
    expect(typeof plugin._transform).toBe('function')
    expect(plugin.readableObjectMode).toBe(true)
    expect(plugin.writableObjectMode).toBe(true)
  })

  it('should skip null files', async () => {
    const plugin = tscom()
    const mockFile = { isNull: () => true } as File
    const callback = vi.fn()

    // @ts-expect-error доступ к приватному методу
    plugin._transform(mockFile, null, callback)
    expect(callback).toHaveBeenCalledWith(null, mockFile)
  })

  it('should reject streams', async () => {
    const plugin = tscom()
    const mockFile = {
      isNull: () => false,
      isStream: () => true,
    } as File
    const callback = vi.fn()

    // @ts-expect-error доступ к приватному методу
    plugin._transform(mockFile, null, callback)
    expect(callback).toHaveBeenCalledWith(expect.any(Error))
    const error = callback.mock.calls[0][0]
    expect(error.message).toContain('Streams are not supported')
  })

  it('should throw error for unsupported file extension', async () => {
    const plugin = tscom()
    const mockFile = {
      isNull: () => false,
      isStream: () => false,
      isBuffer: () => true,
      path: 'test.txt',
      sourceMap: undefined,
    } as unknown as File
    const callback = vi.fn()

    // @ts-expect-error доступ к приватному методу
    plugin._transform(mockFile, null, callback)
    // Ошибка должна быть передана в callback
    expect(callback).toHaveBeenCalledWith(expect.any(Error))
    const error = callback.mock.calls[0][0]
    expect(error.message).toContain('Only file extensions ".js" or ".ts" are supported')
  })

  it('should process .js file correctly', async () => {
    // Мок rolldown
    const mockBundle = {
      generate: vi.fn().mockResolvedValue({
        output: [
          {
            code: 'console.log("hello")',
            map: null,
          },
        ],
      }),
    }
    ;(rolldown as any).mockResolvedValue(mockBundle)

    const plugin = tscom()
    const mockFile = {
      isNull: () => false,
      isStream: () => false,
      isBuffer: () => true,
      path: 'test.js',
      sourceMap: undefined,
      extname: '.js',
      contents: Buffer.from(''),
    } as unknown as File
    const callback = vi.fn()

    // @ts-expect-error доступ к приватному методу
    await plugin._transform(mockFile, null, callback)
    expect(rolldown).toHaveBeenCalledWith({
      input: 'test.js',
    })
    expect(mockBundle.generate).toHaveBeenCalledWith({
      format: 'esm',
      sourcemap: false,
      minify: false,
    })
    expect(callback).toHaveBeenCalledWith(null, expect.any(Object))
    // Проверяем, что содержимое файла обновлено
    const resultFile = callback.mock.calls[0][1]
    expect(resultFile.contents.toString()).toBe('console.log("hello");')
  })

  it('should rename .ts extension to .js', async () => {
    const mockBundle = {
      generate: vi.fn().mockResolvedValue({
        output: [
          {
            code: 'console.log("typescript")',
            map: null,
          },
        ],
      }),
    }
    ;(rolldown as any).mockResolvedValue(mockBundle)

    const plugin = tscom()
    const mockFile = {
      isNull: () => false,
      isStream: () => false,
      isBuffer: () => true,
      path: 'test.ts',
      sourceMap: undefined,
      extname: '.ts',
      contents: Buffer.from(''),
    } as unknown as File
    const callback = vi.fn()

    // @ts-expect-error доступ к приватному методу
    await plugin._transform(mockFile, null, callback)
    const resultFile = callback.mock.calls[0][1]
    expect(resultFile.extname).toBe('.js')
  })

  it('should handle source maps', async () => {
    const mockSourceMap = { version: 3 }
    const mockBundle = {
      generate: vi.fn().mockImplementation(async () => {
        const result = {
          output: [
            {
              code: 'console.log("with map")',
              map: JSON.stringify(mockSourceMap),
            },
          ],
        }
        console.log('generate returning', result)
        return result
      }),
    }
    ;(rolldown as any).mockResolvedValue(mockBundle)

    const plugin = tscom({ minify: false })
    const mockFile = {
      isNull: () => false,
      isStream: () => false,
      isBuffer: () => true,
      path: 'test.js',
      sourceMap: { some: 'map' }, // наличие sourceMap
      extname: '.js',
      contents: Buffer.from(''),
    } as unknown as File
    const callback = vi.fn()

    // @ts-expect-error доступ к приватному методу
    await plugin._transform(mockFile, null, callback)
    expect(mockBundle.generate).toHaveBeenCalledWith({
      format: 'esm',
      sourcemap: 'hidden',
      minify: false,
    })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(null, expect.any(Object))
    const resultFile = callback.mock.calls[0][1]
    expect(resultFile).toBeDefined()
    expect(resultFile.sourceMap).toEqual(JSON.stringify(mockSourceMap))
  })
})
