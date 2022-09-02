import { reactive, trackEffects, triggerEffects, isTracking } from './index'
import { isObject, hasChanged } from './shared/index'

class RefImpl {
	private _value: any
	public dep
  public _rawValue
	constructor(value) {
    this._rawValue = value
		// 如果value是对象 --> 转成reactive
		this._value = convert(value)
		this.dep = new Set()
	}
	get value() {
		trackRefValue(this)
		return this._value
	}
	set value(newValue) {
		// 先修改value的值 再trigger
    // 如果ref是对象 则_value为proxy 需要用一个raw值来代替判断
		if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue
			this._value = convert(newValue)
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
