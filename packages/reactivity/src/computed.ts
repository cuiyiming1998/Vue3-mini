import { ReactiveEffect } from './effect'

class ComputedRefImpl {
  private _getter: any
  private _dirty = true // 初始化dirty时为true
  private _value: any
  private _effect: any
  constructor(getter) {
    this._getter = getter
    // 当依赖的响应式对象的值发生改变的时候 会通过scheduler 将dirty设置成true
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty)
        this._dirty = true
    })
  }

  get value() {
    // 如果dirty为true 则说明依赖发生过改变 或初始化状态
    // 这个时候需要重新执行effect.run() 获取最新的值
    if (this._dirty) {
      this._dirty = false
      // 第一次run的时候会触发响应式对象 get -> 收集依赖
      this._value = this._effect.run()
    }
    return this._value
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter)
}
