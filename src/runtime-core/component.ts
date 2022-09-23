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
    next: null, // 需要更新的 vnode，用于更新 component 类型的组件
		setupState: {}, // setup的返回值
    props: {}, // 当前组件props
    slots: {}, // 当前组件的插槽
    provides: parent ? parent.provides : {}, // 获取 parent 的 provides 作为当前组件的初始化值 这样就可以继承 parent.provides 的属性了
    parent, // 父组件
    isMounted: false, // 是否被mount过, 在初始化后会被修改成true
    subTree: {}, // 组件的虚拟节点树
    emit: () => {}, // emit方法
	}

  // 赋值 emit
  // 这里使用 bind 把 instance 和 component 进行绑定
  // 后面用户使用的时候只需要给 event 和参数即可
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
  // 1. 创建代理对象
  console.log("创建 proxy");
	instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

  // 2. 调用setup
  // 调用 setup 的时候传入 props
	const { setup } = Component
	if (setup) {
    // 赋值currentInstance
    // 必须要在调用 setup 之前
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
    // proxyRefs 的作用就是把 setupResult 对象做一层代理
    // 方便用户直接访问 ref 类型的值
    // 比如 setupResult 里面有个 count 是个 ref 类型的对象，用户使用的时候就可以直接使用 count 了，而不需要在 count.value
    // 这里也就是官网里面说到的自动结构 Ref 类型
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
