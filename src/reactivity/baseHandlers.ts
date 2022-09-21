import { track, trigger, reactive, readonly } from './index'
import { ReactiveFlags } from './reactive'
import { isObject, extend } from '../shared'

const get = createGetter()
const readonlyGet = createGetter(true) // readonly的get
const set = createSetter()
const shallowReadonlyGet = createGetter(true, true) // shallowReadonly的get

/**
 * description
 * 创建getter
 *
 * @param isReadonly 是否readonly
 * @param isShallow 是否shallow
 * @return
 *
 */
function createGetter(isReadonly: boolean = false, isShallow: boolean = false) {
	return function get(target, key) {
		if (ReactiveFlags.IS_REACTIVE === key) {
      // 如果调用isReactive 返回!isReadonly
			return !isReadonly
		} else if (ReactiveFlags.IS_READONLY === key) {
      // 如果调用isReadonly 返回isReadonly
			return isReadonly
		}
		const res = Reflect.get(target, key)

    // 如果是shallow 则直接返回res
		if (isShallow) {
			return res
		}

    // 如果res是对象
    // 则继续对res进行readonly或reactive操作
		if (isObject(res)) {
			return isReadonly ? readonly(res) : reactive(res)
		}
    // 如果不是readonly 进行track
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
    // 触发trigger
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

// shallowReadonly继承readonlyHandlers
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
	get: shallowReadonlyGet
})
