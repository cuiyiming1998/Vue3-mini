import { reactive, effect, stop } from '../src'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('effect', () => {
	it('happy path', () => {
		const user = reactive({
			age: 10
		})
		let nextAge
		effect(() => {
			nextAge = user.age + 1
		})
		expect(nextAge).toBe(11)

		// update
		user.age++
		expect(nextAge).toBe(12)
	})

	it('should return runner when call effect', () => {
		// runner
		let foo = 10
		const runner = effect(() => {
			foo++
			return 'foo'
		})
		expect(foo).toBe(11)
		const r = runner()
		expect(foo).toBe(12)
		expect(r).toBe('foo')
	})

	it('schedular', () => {
		// 通过effect的第二个参数 给定一个schedular
		// 当effect第一次执行的时候, 执行fn
		// 当响应式对象更新的时候 不会执行fn, 而是执行schedular
		// 当执行runner的时候 会再次执行fn
		let dummy
		let run: any
		const schedular = vi.fn(() => {
			run = runner
		})
		const obj = reactive({ foo: 1 })
		const runner = effect(
			() => {
				dummy = obj.foo
			},
			{ schedular }
		)
		expect(schedular).not.toHaveBeenCalled()
		obj.foo++
		expect(schedular).toHaveBeenCalledTimes(1)
		expect(dummy).toBe(1)
		run()
		expect(dummy).toBe(2)
	})

	it('stop', () => {
		let dummy
		const obj = reactive({ prop: 1 })
		const runner = effect(() => {
			dummy = obj.prop
		})
		obj.prop = 2
		expect(dummy).toBe(2)
		stop(runner)
		obj.prop = 3
		expect(dummy).toBe(2)

		// stopped effect should still be manually callable
		runner()
		expect(dummy).toBe(3)
	})

	it('onStop', () => {
		const obj = reactive({
			foo: 1
		})
		const onStop = vi.fn()
		let dummy
		const runner = effect(
			() => {
				dummy = obj.foo
			},
			{
				onStop
			}
		)

		stop(runner)
		expect(onStop).toBeCalledTimes(1)
	})
})
