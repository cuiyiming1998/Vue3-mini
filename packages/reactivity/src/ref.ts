import { track, trigger } from './effect'
import { reactive } from './reactive'

export function isRef(val) {
  return !!val?._isRef
}

export function ref(val) {
  return isRef(val) ? val : new RefImpl(val)
}

function convert(val) {
  return typeof val === 'object' ? reactive(val) : val
}

class RefImpl {
  private _isRef
  private _val
  constructor(val) {
    this._isRef = true
    this._val = convert(val)
  }
  get value() {
    track(this, 'ref-get', 'value')
    return this._val
  }
  set value(val) {
    if (val !== this._val) {
      this._val = convert(val)
      trigger(this, 'ref-set', 'value')
    }
  }
}
