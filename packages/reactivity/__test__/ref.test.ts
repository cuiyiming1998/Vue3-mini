import { ref, effect } from '../src'
import { describe, it, expect, vi } from 'vitest'

describe('ref', () => {
  it('数字和字符串', () => {
    let r = ref(0)
    let val
    effect(() => {
      val = r.value
    })
    expect(val).toBe(0)
    r.value ++
    expect(val).toBe(1)
  })

  it('支持复杂数据', () => {
    let r = ref({
      name: '张三'
    })
    let val
    effect(() => {
      val = r.value.name
    })
    expect(val).toBe('张三')
    r.value.name = '李四'
    expect(val).toBe('李四')
  })
})