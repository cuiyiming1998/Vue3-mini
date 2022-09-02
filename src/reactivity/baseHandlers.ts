import { track, trigger, reactive, readonly } from './index'
import { ReactiveFlags } from './reactive'
import { isObject, extend } from '../shared'

const get = createGetter()
const readonlyGet = createGetter(true)
const set = createSetter()
const shallowReadonlyGet = createGetter(true, true)

/**
 * @description: 创建getter
 * @param { isReadonly: Boolean } 判断是否是readonly
 * @return { get }
 */
function createGetter(isReadonly: boolean = false, isShallow: boolean = false) {
	return function get(target, key) {
		if (ReactiveFlags.IS_REACTIVE === key) {
			return !isReadonly
		} else if (ReactiveFlags.IS_READONLY === key) {
			return isReadonly
		}
		const res = Reflect.get(target, key)

		if (isShallow) {
			return res
		}

		if (isObject(res)) {
			return isReadonly ? readonly(res) : reactive(res)
		}
		if (!isReadonly) {
			track(target, key)
		}
		return res
	}
}

/**
 * @description: 创建setter
 * @param { Void }
 * @return { set }
 */
function createSetter() {
	return function set(target, key, value) {
		const res = Reflect.set(target, key, value)
		trigger(target, key)
		return res
	}
}

export const mutableHandlers = {
	get,
	set
}

export const readonlyHandlers = {
	get: readonlyGet,
	set(target, key, value) {
		console.warn(`key: ${key} set 失败, 因为target为 readonly, ${target}`)
		return true
	}
}

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
	get: shallowReadonlyGet
})
