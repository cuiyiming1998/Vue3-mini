import { reactive } from './reactive'
import { track, trigger } from './effect'

// 管理get set delete等proxy

function createGetter(shallow: boolean) {
  return function get(target, key) {
    track(target, 'get', key)
    let res =  Reflect.get(target, key)
    if (typeof res === 'object') {
      return shallow ? res : reactive(res)
    }
    return Reflect.get(target, key)
  }
}

function set(target, key, val) {
  Reflect.set(target, key, val)
  trigger(target, 'set', key, val)
  return true
}

export const mutableHandlers = {
  get: createGetter(false),
  set
}

export const shallowReactiveHandlers = {
  get: createGetter(true),
  set
}