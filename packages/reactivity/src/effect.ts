// 管理对象key的依赖
// {
//   target: {
//     key: [effect1, effect2]
//   }
// }
const targetMap = new WeakMap()
let activeEffect: any = null

export function track(target, type, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let deps = depsMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }
  if (activeEffect) {
    console.log(deps)
    deps.add(activeEffect)
  }
  depsMap.set(key, deps)
}

export function trigger(target, type, key, val) {
  const depsMap = targetMap.get(target)
  if (!depsMap) { return }
  const deps = depsMap.get(key)
  if (!deps) { return }
  deps.forEach(fn => fn())
}

export function effect(fn: Function) {
  activeEffect = fn
  fn()
}