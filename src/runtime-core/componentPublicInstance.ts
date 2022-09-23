import { hasOwn } from '../shared'

const publicPropertiesMap = {
	$el: i => i.vnode.el, // 当前组件vnode实例
	$slots: i => i.slots, // 当前组件slots
	$props: i => i.props
}

export const PublicInstanceProxyHandlers = {
	get({ _: instance }, key) {
		const { setupState, props } = instance
		console.log(`触发 proxy hook , key -> : ${key}`)

		// 通过this可以获取setup返回值或prop
		if (key[0] !== '$') {
			// 说明不是访问 public api
			// 先检测访问的 key 是否存在于 setupState 中, 是的话直接返回
			if (hasOwn(setupState, key)) {
				return setupState[key]
			} else if (hasOwn(props, key)) {
				return props[key]
			}
		}
		const publicGetter = publicPropertiesMap[key]
		// 其他代理对象 $el等
		if (publicGetter) {
			return publicGetter(instance)
		}
	}
}
