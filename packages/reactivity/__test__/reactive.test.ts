import { describe, it, expect } from 'vitest'
import { reactive, effect } from "../src"

describe('响应式测试', () => {
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
})

