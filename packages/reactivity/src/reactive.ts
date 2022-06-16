// import { mutableHandlers, shallowReactiveHandlers } from './baseHandlers'
import { mutableHandlers } from './baseHandlers'

export const reactiveMap = new WeakMap() // 代理对象 -> 原始对象的缓存

let bucket = new Set()
export function reactive(target: Object) {
  return createReactiveObject(target, reactiveMap, mutableHandlers)
}

export function shallowReactive(target){}

function createReactiveObject(target: Object, proxyMap, proxyHandlers) {
  if (typeof target !== 'object') {
    console.warn('target must be an object')
    return target
  }
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  const proxy = new Proxy(target, proxyHandlers)
  proxyMap.set(target, proxy)
  return proxy
}