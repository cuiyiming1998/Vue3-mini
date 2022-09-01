import { reactive, isReactive } from '../src'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('reactive', () => {
  it('happy path', () => {
    const original = {
      foo: 1
    }
    const observed = reactive(original)
    expect(observed).not.toBe(original)
    expect(observed.foo).toBe(1)
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
  })
})
