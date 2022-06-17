import { reactive } from './reactive'
import { track, trigger } from './effect'

// 管理get set delete等proxy

function createGetter(shallow: boolean) {
  return function get(target, key, receiver) {
    track(target, 'get', key)
    let res =  Reflect.get(target, key, receiver)
    if (typeof res === 'object') {
      return shallow ? res : reactive(res)
    }
    return Reflect.get(target, key)
  }
}

function hasOwn(target, key) {
  return Object.prototype.hasOwnProperty.call(target, key)
}

function deleteProperty (target, key) {
  const hasKey = hasOwn(target, key)
  let res = Reflect.deleteProperty(target, key)
  if (res && hasKey) {
    trigger(target, 'delete', key)
  }
  return res
}

function set(target, key, val, receiver) {
  Reflect.set(target, key, val, receiver)
  trigger(target, 'set', key)
  return true
}

export const mutableHandlers = {
  get: createGetter(false),
  set,
  deleteProperty
}

export const shallowReactiveHandlers = {
  get: createGetter(true),
  set,
  deleteProperty
}