import { reactive, effect, computed } from '../src'
import { describe, it, expect, vi } from 'vitest'

describe('计算属性', () => {
  it('lazy配置', () => {
    let obj = reactive({
      name: '张三'
    })
    let fn = vi.fn((...args) => {})
    let effectFn = effect(() => {
      fn(obj.name)
    }, { lazy: true })
    expect(fn).toBeCalledTimes(0)
    effectFn()
    expect(fn).toBeCalledTimes(1)
  })

  it('计算属性', () => {
    let obj = reactive({
      age: 18
    })
    let fn = vi.fn((...args) => {})
    let double = computed(() => {
      fn()
      return obj.age * 2
    })
    expect(fn).toHaveBeenCalledTimes(0)
    expect(double.value).toBe(36)
    expect(fn).toHaveBeenCalledTimes(1)
    obj.age++
    expect(double.value).toBe(38)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})