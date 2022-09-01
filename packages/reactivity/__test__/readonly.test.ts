import { readonly } from '../src'
import { describe, it, expect, vi } from 'vitest'

describe('readonly', () => {
  it('happy path', () => {
    const original = {
      foo: 1,
      bar: {
        baz: 2
      }
    }
    const wrapped = readonly(original)
    expect(wrapped).not.toBe(original)
    expect(wrapped.foo).toBe(1)
  })

  it('warn when call set', () => {
    console.warn = vi.fn()
    const user = readonly({
      age: 10
    })
    user.age = 11
    expect(console.warn).toBeCalledTimes(1)
  })
})