import { track, trigger } from './effect'

// 管理get set delete等proxy

function get(target, key) {
  track(target, 'get', key)
  return Reflect.get(target, key)
}
function set(target, key, val) {
  Reflect.set(target, key, val)
  trigger(target, 'set', key, val)
  return true
}

export const mutableHandlers = {
  get,
  set
}