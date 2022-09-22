import { hasOwn } from '../shared'

const publicPropertiesMap = {
	$el: i => i.vnode.el, // 当前组件vnode实例
	$slots: i => i.slots, // 当前组件slots
  $props: i => i.props
}

export const PublicInstanceProxyHandlers = {
	get({ _: instance }, key) {
		const { setupState, props } = instance
		// 拿到setup的返回值
		if (key in setupState) {
			return setupState[key]
		}
		// 通过this可以获取setup返回值或prop
		if (hasOwn(setupState, key)) {
			return setupState[key]
		} else if (hasOwn(props, key)) {
			return props[key]
		}
		const publicGetter = publicPropertiesMap[key]
		// 其他代理对象 $el等
		if (publicGetter) {
			return publicGetter(instance)
		}
	}
}
