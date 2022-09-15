import { ShapeFlags } from './../shared/shapeFlags'
/*
  type -> 'div' / 'span'
  props -> attribute
  children
*/
export function createVNode(type, props?, children?) {
	const vnode = {
		type,
		props,
		children,
		shapeFlag: getShapeFlag(type),
		el: null
	}
  if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }
  // 组件类型 + objectChildren
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === 'object') {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN
    }
  }
	return vnode
}

function getShapeFlag(type) {
	return typeof type === 'string'
		? ShapeFlags.ELEMENT
		: ShapeFlags.STATEFUL_COMPONENT
}
