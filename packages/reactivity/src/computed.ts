import { effect, track, trigger } from './effect'

export function computed(getter) {
  let value
  let dirty = true // 防止重复计算
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      if (!dirty) {
        dirty = true
      }
    },
  })

  let obj = {
    get value() {
      if (dirty) {
        value = effectFn()
        dirty = false
      }
      return value
    }
  }
  return obj
}