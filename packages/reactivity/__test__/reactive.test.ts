import { reactive, shallowReactive, effect } from '../src'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('响应式测试', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  it('测试一下reactive和effect', () => {
    let obj = reactive({
      name: '张三',
    })

    let dummy
    effect(() => {
      dummy = obj.name
    })
    expect(dummy).toBe('张三')
    obj.name = '李四'
    expect(dummy).toBe('李四')
  })

  it('响应式系统分支切换 cleanup', () => {
    let obj = reactive({
      ok: true,
      text: 'hello',
    })
    let message
    let fn = vi.fn(() => {
      message = obj.ok ? obj.text : 'no'
    })
    effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(message).toBe('hello')
    obj.text = 'world'
    expect(fn).toHaveBeenCalledTimes(2)
    expect(message).toBe('world')
    obj.ok = false
    expect(message).toBe('no')
    expect(fn).toHaveBeenCalledTimes(3)
    obj.text = 'bye'
    expect(fn).toHaveBeenCalledTimes(3)
    // 无论text怎么改 都不会触发effect
  })

  it('effect嵌套的场景', () => {
    let data = {
      foo: true,
      bar: true,
    }
    let obj = reactive(data)
    let tmp1, tmp2
    let fn1 = vi.fn(() => {})
    let fn2 = vi.fn(() => {})
    // activeEffect -> fn1
    effect(() => {
      fn1()
      // activeEffect -> fn2
      effect(() => {
        fn2()
        tmp2 = obj.bar
      })
      tmp1 = obj.foo
    })
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
    obj.foo = false
    expect(fn1).toHaveBeenCalledTimes(2)
  })

  it('嵌套响应式', () => {
    const data = reactive({
      name: '张三',
      info: {
        age: 18
      }
    })
    let dummy
    effect(() => {
      dummy = data.info.age
    })
    expect(dummy).toBe(18)
    data.info.age++
    expect(dummy).toBe(19)
  })

  it('浅层次嵌套响应式', () => {
    const data = shallowReactive({
      name: '张三',
      info: {
        age: 18
      }
    })
    let dummy
    effect(() => {
      dummy = data.info.age
    })
    expect(dummy).toBe(18)
    data.info.age++
    expect(dummy).toBe(18)
  })

  it('调度逻辑', async () => {
    let obj = reactive({
      age: 18
    })
    let arr1: any[] = []
    effect(() => {
      arr1.push(obj.age)
    })
    let arr: any[] = []
    effect(() => {
      arr.push(obj.age)
    }, {
      scheduler(fn) {
        setTimeout(fn)
      }
    })
    obj.age++
    arr.push('end')
    arr1.push('end')
    await vi.runAllTimers()
    expect(arr1).toEqual([18, 19, 'end'])
    expect(arr).toEqual([18, 'end', 19])
  })

  it('删除属性', () => {
    let obj = reactive({
      name: '张三',
      age: 18
    })
    let hasFn = vi.fn((...args) => {

    })
    let deleteFn = vi.fn((...args) => {})
    effect(() => {
      for (const key in obj) {
        hasFn(key)
      }
      deleteFn(obj.name)
    })
    expect(hasFn).toHaveBeenCalledTimes(2)
    expect(deleteFn).toHaveBeenCalledTimes(1)
    delete obj.name
    expect(deleteFn).toHaveBeenCalledTimes(2)
    expect(hasFn).toHaveBeenCalledTimes(3)
  })

  it('数组相关的操作', () => {
    let arr = reactive([])
    effect(() => {
      arr.push(1)
    })
    effect(() => {
      arr.push(2)
    })
    expect(arr.join(',')).toBe('1,2')
  })
})
