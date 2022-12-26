import { ReactiveEffect } from './../../reactivity/src/effect'
import { queuePreFlushCb } from './scheduler'

export function watchEffect(source) {
	function job() {
		effect.run()
	}

	let cleanup

	const onCleanup = fn => {
		cleanup = effect.onStop = () => {
			fn()
		}
	}
	function getter() {
		// 初始化的时候不调用
		if (cleanup) {
			cleanup()
		}
		source(onCleanup)
	}

	const effect = new ReactiveEffect(getter, () => {
		queuePreFlushCb(job)
	})

	effect.run()

	return () => {
		effect.stop()
	}
}
