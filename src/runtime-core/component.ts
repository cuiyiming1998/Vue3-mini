import { shallowReadonly } from '../reactivity'
import { emit } from './componentEmit'
import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { initSlots } from './componentsSlots'

export function createComponentInstance(vnode) {
	const component = {
		vnode,
		type: vnode.type,
		setupState: {},
    props: {},
    emit: () => {},
    slots: {},
	}
  component.emit = emit.bind(null, component) as any
	return component
}

export function setupComponent(instance) {
	initProps(instance, instance.vnode.props)
	initSlots(instance, instance.vnode.children)

	// 初始化有状态的component
	setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
	// 调用setup 拿到setup的返回值
	const Component = instance.type

	instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

	const { setup } = Component
	if (setup) {
		// Function or Object
		const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    })

		handleSetupResult(instance, setupResult)
	}
}

function handleSetupResult(instance: any, setupResult: any) {
	// TODO 后续实现function
	if (typeof setupResult === 'object') {
		instance.setupState = setupResult
	}

	finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
	const Component = instance.type

	if (!instance.render) {
		instance.render = Component.render
	}
}
