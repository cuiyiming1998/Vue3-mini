import { extend } from './shared/index'

class ReactiveEffect {
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
		activeEffect = this
		return this._fn()
	}

	stop() {
    if (this.active) {
      cleanupEffect(this)
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
	}
}

function cleanupEffect(effect) {
	effect.deps.forEach((dep: any) => {
		dep.delete(effect)
	})
}

const targetMap = new Map()
export function track(target, key) {
	let depsMap = targetMap.get(target)
	if (!depsMap) {
		targetMap.set(target, (depsMap = new Map()))
	}

	let dep = depsMap.get(key)
	if (!dep) {
		depsMap.set(key, (dep = new Set()))
	}
  if (!activeEffect) {
    return
  }
	dep.add(activeEffect)
	activeEffect.deps.push(dep)
}

export function trigger(target, key) {
	let depsMap = targetMap.get(target)
	let dep = depsMap.get(key)
	for (const effect of dep) {
		if (effect.schedular) {
			effect.schedular()
		} else {
			effect.run()
		}
	}
}

let activeEffect
export function effect(fn, options: any = {}) {
	const _effect = new ReactiveEffect(fn, options.schedular)
  extend(_effect, options)
	_effect.run()

	const runner: any = _effect.run.bind(_effect)
	runner.effect = _effect

	return runner
}

export function stop(runner) {
	runner.effect.stop()
}
