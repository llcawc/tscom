import { rolldown } from 'rolldown'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { compile } from '../src/tscom'
import { glob } from 'tinyglobby'

// Мокируем rolldown и tinyglobby
vi.mock('rolldown', () => ({
  rolldown: vi.fn(),
}))

vi.mock('tinyglobby', () => ({
  glob: vi.fn(),
}))

describe('compile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should compile a single file', async () => {
    // Мок glob возвращает один файл
    ;(glob as any).mockResolvedValue(['src/test.js'])

    const mockBundle = {
      write: vi.fn().mockResolvedValue(undefined),
    }
    ;(rolldown as any).mockResolvedValue(mockBundle)

    await compile({
      input: 'src/*.js',
      dir: 'dist',
      format: 'es',
      minify: false,
      sourcemap: false,
    })

    expect(glob).toHaveBeenCalledWith('src/*.js', { ignore: undefined })
    expect(rolldown).toHaveBeenCalledWith({
      input: 'src/test.js',
    })
    expect(mockBundle.write).toHaveBeenCalledWith({
      dir: 'dist',
      format: 'es',
      sourcemap: false,
      minify: false,
      comments: true,
    })
  })

  it('should compile multiple files', async () => {
    ;(glob as any).mockResolvedValue(['src/a.js', 'src/b.js'])

    const mockBundle = {
      write: vi.fn().mockResolvedValue(undefined),
    }
    ;(rolldown as any).mockResolvedValue(mockBundle)

    await compile({
      input: ['src/*.js'],
      dir: 'out',
      format: 'cjs',
      minify: true,
      sourcemap: true,
    })

    expect(glob).toHaveBeenCalledWith(['src/*.js'], { ignore: undefined })
    // rolldown должен быть вызван дважды
    expect(rolldown).toHaveBeenCalledTimes(2)
    expect(mockBundle.write).toHaveBeenCalledTimes(2)
  })

  it('should handle ignore patterns', async () => {
    ;(glob as any).mockResolvedValue(['src/a.js'])

    const mockBundle = {
      write: vi.fn().mockResolvedValue(undefined),
    }
    ;(rolldown as any).mockResolvedValue(mockBundle)

    await compile({
      input: ['src/*.js', '!src/excluded.js'],
      dir: 'dist',
    })

    // Проверяем, что glob вызван с правильными параметрами
    expect(glob).toHaveBeenCalledWith(['src/*.js'], { ignore: ['src/excluded.js'] })
  })

  it('should throw error for unsupported file extension', async () => {
    ;(glob as any).mockResolvedValue(['src/test.txt'])

    await expect(
      compile({
        input: 'src/*.txt',
      }),
    ).rejects.toThrow('Only file extensions ".js" or ".ts" are supported')
  })

  it('should propagate errors from rolldown', async () => {
    ;(glob as any).mockResolvedValue(['src/test.js'])
    ;(rolldown as any).mockRejectedValue(new Error('rolldown error'))

    await expect(
      compile({
        input: 'src/*.js',
      }),
    ).rejects.toThrow('rolldown error')
  })

  it('should use default options', async () => {
    ;(glob as any).mockResolvedValue(['src/test.js'])

    const mockBundle = {
      write: vi.fn().mockResolvedValue(undefined),
    }
    ;(rolldown as any).mockResolvedValue(mockBundle)

    await compile({
      input: 'src/*.js',
    })

    expect(rolldown).toHaveBeenCalledWith({
      input: 'src/test.js',
    })
    expect(mockBundle.write).toHaveBeenCalledWith({
      dir: 'dist',
      format: 'esm',
      sourcemap: false,
      minify: true,
      comments: false,
    })
  })

  it('should handle TypeScript files', async () => {
    ;(glob as any).mockResolvedValue(['src/test.ts'])

    const mockBundle = {
      write: vi.fn().mockResolvedValue(undefined),
    }
    ;(rolldown as any).mockResolvedValue(mockBundle)

    await compile({
      input: 'src/*.ts',
    })

    expect(rolldown).toHaveBeenCalledWith({
      input: 'src/test.ts',
    })
  })
})
