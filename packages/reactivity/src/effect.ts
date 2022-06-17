// 管理对象key的依赖
// {
//   target: {
//     key: [effect1, effect2]
//   }
// }
const targetMap = new WeakMap()
let activeEffect: any = null
let effectStack: any[] = [] // 处理effect嵌套的栈

interface EffectOption {
  scheduler?: (effectFn: Function) => void
  lazy?: boolean
}

export function effect(fn: Function, options?: EffectOption) {
  const effectFn = () => {
    let result
    try {
      cleanup(effectFn)
      activeEffect = effectFn
      effectStack.push(activeEffect)
      result = fn()
    } finally {
      activeEffect = null
    }
    return result
  }
  effectFn.deps = [] // 需要知道effect的依赖
  if (!options?.lazy) {
    effectFn()
  }
  // 执行完 出栈
  effectStack.pop()
  activeEffect = effectStack[effectStack.length - 1]
  effectFn.options = options || {}
  return effectFn
}
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
    deps.add(activeEffect)
    activeEffect.deps.push(deps)
  }
  depsMap.set(key, deps)
}

export function trigger(target, type, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) { return }
  const deps = depsMap.get(key)
  if (!deps) { return }
  const depsToRun = new Set(deps)
  depsToRun.forEach((effectFn: any) => {
    if (effectFn !== activeEffect) {
      if (effectFn.options.scheduler) {
        effectFn.options.scheduler(effectFn)
      } else {
        effectFn()
      }
    }
  })
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i ++) {
    effectFn.deps[i].delete(effectFn)
  }
  effectFn.deps.length = 0
}