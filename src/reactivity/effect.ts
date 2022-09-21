import { extend } from '../shared'

let activeEffect // 代表当前的副作用对象 ReactiveEffect
let shouldTrack // 代表当前是否需要 track 收集依赖
const targetMap = new Map()

export class ReactiveEffect {
	private _fn: any
	public schedular: Function | undefined
  public active: boolean = true
	public deps: any[]
  public onStop?: () => void
	constructor(_fn, schedular?) {
		this.deps = []
		this._fn = _fn
		this.schedular = schedular
	}

	run() {
    // 将this赋值给activeEffect 当前正在执行的effect
		activeEffect = this
    if (!this.active) {
      return this._fn()
    }
    shouldTrack = true
    // shouldTrack为true
    // 执行fn收集依赖
    activeEffect = this
    const result = this._fn()
    // 收集完依赖将关闭shouldTrack
    shouldTrack = false

    return result
	}

	stop() {
    // 停止响应式
    if (this.active) {
      // 清空dep
      cleanupEffect(this)
      if (this.onStop) {
        // 执行生命周期函数
        this.onStop()
      }
      // 修改active状态为false
      this.active = false
    }
	}
}

function cleanupEffect(effect) {
  // 清除effect.deps
	effect.deps.forEach((dep: any) => {
		dep.delete(effect)
	})
  effect.deps.length = 0
}

export function track(target, key) {
  if (!isTracking()) {
    return
  }
  // 从targetMap中获取depsMap
	let depsMap = targetMap.get(target)
	if (!depsMap) {
		targetMap.set(target, (depsMap = new Map()))
	}

	let dep = depsMap.get(key)
	if (!dep) {
		depsMap.set(key, (dep = new Set()))
	}

  // 寻找到当前target, key的dep后添加effect
  trackEffects(dep)
}

export function trackEffects(dep) {
  if (dep.has(activeEffect)) {
    return
  }
  // dep添加effect
  // activeEffect的上层依赖中也添加dep
  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}
/*
  * 没有被 effect 包裹时，由于没有副作用函数（即没有依赖，activeEffect === undefined），不应该收集依赖
  * 只有在 effect内部的情况下才会收集依赖
  * 某些特殊情况，即使包裹在 effect，也不应该收集依赖（即 shouldTrack === false）。如：组件生命周期执行、组件 setup 执行
*/
export function isTracking() {
  return shouldTrack && undefined !== activeEffect
}

export function trigger(target, key) {
	let depsMap = targetMap.get(target)
	let dep = depsMap.get(key)
  // 获取target key对应的dep
  triggerEffects(dep)
}
export function triggerEffects(dep) {
  // 循环dep 如果有schedular 则执行
  // 否则run
  for (const effect of dep) {
		if (effect.schedular) {
			effect.schedular()
		} else {
			effect.run()
		}
	}
}
export function effect(fn, options: any = {}) {
	const _effect = new ReactiveEffect(fn, options.schedular)
  // 创建activeEffect
  extend(_effect, options)
  // 创建时执行一次
	_effect.run()

  // 创建返回值 effect会返回内部函数
	const runner: any = _effect.run.bind(_effect)
	runner.effect = _effect

	return runner
}

export function stop(runner) {
	runner.effect.stop()
}
