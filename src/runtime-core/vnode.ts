import { ShapeFlags } from './../shared/shapeFlags'

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

export {
  createVNode as createElementVNode
}
/*
  type -> 'div' / 'span'
  props -> attribute
  children
*/
export function createVNode(type, props?, children?) {
	const vnode = {
		type, // 组件类型
		props, // props
		component: null,
		children, // 孩子节点, 可以是text(文本节点) 或者 array(嵌套子节点)
		shapeFlag: getShapeFlag(type), // 类型标识
		key: props && props.key,
		el: null // 当前实例
	}
	if (typeof children === 'string') {
		vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
	} else if (Array.isArray(children)) {
		vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
	}
	if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
		if (typeof children === 'object') {
			// 如果是组件类型 且children为object
			// 则当前节点属于slotChildren
			// 暂时只有 element 类型和 component 类型的组件
			// 所以这里除了 element ，那么只要是 component 的话，那么children 肯定就是 slots 了
			vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN
		}
	}
	return vnode
}

export function createTextVnode(text: string) {
	return createVNode(Text, {}, text)
}

function getShapeFlag(type) {
	// 如果类型是string则为element类型
	// 否则为component类型
	return typeof type === 'string'
		? ShapeFlags.ELEMENT
		: ShapeFlags.STATEFUL_COMPONENT
}
