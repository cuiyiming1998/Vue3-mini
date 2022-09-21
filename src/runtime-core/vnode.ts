import { ShapeFlags } from './../shared/shapeFlags'

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
/*
  type -> 'div' / 'span'
  props -> attribute
  children
*/
export function createVNode(type, props?, children?) {
	const vnode = {
		type, // 组件类型
		props, // props
		children, // 孩子节点, 可以是text(文本节点) 或者 array(嵌套子节点)
		shapeFlag: getShapeFlag(type), // 类型标识
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
