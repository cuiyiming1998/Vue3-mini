import { reactive, trackEffects, triggerEffects, isTracking } from './index'
import { isObject, hasChanged } from '@vue3-mini/shared'

class RefImpl {
	private _value: any
	public dep
  public _rawValue
  public __v_ifRef = true
	constructor(value) {
    this._rawValue = value
		// 如果value是对象 --> 转成reactive
		this._value = convert(value)
		this.dep = new Set()
	}
	get value() {
    // 这时被effect包裹时 访问.value 会触发track收集依赖
		trackRefValue(this)
		return this._value
	}
	set value(newValue) {
    // 如果ref是对象 则_value为proxy 需要用一个raw值来代替判断
		if (hasChanged(newValue, this._rawValue)) {
      // 先修改value的值
      this._rawValue = newValue
			this._value = convert(newValue)
      // 执行trigger更新
			triggerEffects(this.dep)
		}
	}
}

function convert(value) {
  return isObject(value) ? reactive(value) : value
}

function trackRefValue(ref) {
	if (isTracking()) {
		trackEffects(ref.dep)
	}
}

export function ref(value) {
	return new RefImpl(value)
}

export function isRef(ref) {
  return !!ref?.__v_ifRef
}

export function unRef(ref) {
  // 判断是否是ref 如果是返回ref.value 否则直接返回值
  return isRef(ref) ? ref.value : ref
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      // get -> 如果是ref 返回.value
      return unRef(Reflect.get(target, key))
    },

    set(target, key, value) {
      // 如果原来的值是ref 且新值不是ref 则替换原来的值的.value
      if (isRef(target[key]) && !isRef(value)) {
        return target[key].value = value
      } else {
        return Reflect.set(target, key, value)
      }
    }
  })
}
