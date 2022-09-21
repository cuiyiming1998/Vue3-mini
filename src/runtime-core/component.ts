import { proxyRefs, shallowReadonly } from '../reactivity'
import { emit } from './componentEmit'
import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { initSlots } from './componentsSlots'

export function createComponentInstance(vnode, parent) {
  // 创建组件实例
	const component = {
		vnode, // 当前vnode
		type: vnode.type, // vnode的type
		setupState: {}, // setup的返回值
    props: {}, // 当前组件props
    slots: {}, // 当前组件的插槽
    provides: parent ? parent.provides : {}, // 当前组件的provides, 如果没有 则取父组件的provides
    parent, // 父组件
    isMounted: false, // 是否被mount过, 在初始化后会被修改成true
    subTree: {}, // 组件的虚拟节点树
    emit: () => {}, // emit方法
	}

  // 绑定当前component的emit
  component.emit = emit.bind(null, component) as any
	return component
}

export function setupComponent(instance) {
  // 初始化props
  // 将instance.vnode.props赋值到instance上
	initProps(instance, instance.vnode.props)
  // 初始化slots
	initSlots(instance, instance.vnode.children)

	// 初始化有状态的component
	setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
	const Component = instance.type

  // 创建代理对象 -> 通过this访问props/$el/$slots等
	instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

	const { setup } = Component
	if (setup) {
    // 赋值currentInstance
    setCurrentInstance(instance)
    // 调用setup 获取setup的返回值
    // 第一个参数为shallowReadonly属性的props
    // 第二个参数为 { emit }
		const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    })
    setCurrentInstance(null)

		handleSetupResult(instance, setupResult)
	}
}

function handleSetupResult(instance: any, setupResult: any) {
  // 处理setup的返回值
	// TODO 后续实现function
	if (typeof setupResult === 'object') {
    // setup的返回值用proxyRef包裹
    // 访问和修改ref不用加 .ref
		instance.setupState = proxyRefs(setupResult)
	}

  // 完成组件setup
	finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
	const Component = instance.type

	if (!instance.render) {
    // render赋值
		instance.render = Component.render
	}
}

let currentInstance = null
export function getCurrentInstance() {
  // 获取当前组件instance实例
  // 因为是在setup阶段赋值, 所以只能在setup阶段获取到currentInstance
  return currentInstance
}

export function setCurrentInstance(instance) {
  // 赋值currentInstance
  currentInstance = instance
}
