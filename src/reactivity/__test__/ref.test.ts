import { effect, ref, reactive, isRef, unRef, proxyRefs } from '../index'
import { describe, it, expect, vi } from 'vitest'

describe('ref', () => {
	it('happy path', () => {
		const a = ref(1)
		expect(a.value).toBe(1)
	})

	it('should be reactive', () => {
		const a = ref(1)
		let dummy
		let calls = 0
		effect(() => {
			calls++
			dummy = a.value
		})
		expect(calls).toBe(1)
		expect(dummy).toBe(1)
		a.value = 2
		expect(calls).toBe(2)
		expect(dummy).toBe(2)
		a.value = 2
		expect(calls).toBe(2)
		expect(dummy).toBe(2)
	})

	it('should make nested properties reactive', () => {
		const a = ref({
			count: 1
		})
		let dummy
		effect(() => {
			dummy = a.value.count
		})
		expect(dummy).toBe(1)
		a.value.count = 2
		expect(dummy).toBe(2)
	})

  it('isRef', () => {
    const a = ref(1)
    const user = reactive({
      age: 1
    })
    expect(isRef(a)).toBe(true)
    expect(isRef(1)).toBe(false)
    expect(isRef(user)).toBe(false)
  })

  it('unRef', () => {
    const a = ref(1)
    const user = reactive({
      age: 1
    })
    expect(unRef(a)).toBe(1)
    expect(unRef(1)).toBe(1)
  })

  it('proxyRefs', () => {
    // 通常使用在template里 调用ref而可以不用.value
    const user = {
      age: ref(10),
      name: 'zhangsan'
    }
    const proxyUser = proxyRefs(user)
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe('zhangsan')

    proxyUser.age = 20
    expect(proxyUser.age).toBe(20)
    expect(user.age.value).toBe(20)

    proxyUser.age = ref(10)
    expect(proxyUser.age).toBe(10)
    expect(user.age.value).toBe(10)

  })
})
