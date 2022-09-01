import { reactive } from '../src'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('reactive', () => {
  it('happy path', () => {
    const original = {
      foo: 1
    }
    const observed = reactive(original)
    expect(observed).not.toBe(original)
    expect(observed.foo).toBe(1)
  })
})
