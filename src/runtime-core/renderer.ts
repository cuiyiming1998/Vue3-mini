import { isObject } from '../shared'
import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'

export function render(vnode, container) {
	// 调用patch方法
	patch(vnode, container)
}

function patch(vnode, container) {
	// 去处理组件
	// 判断是不是element类型
  const { shapeFlag } = vnode
	if (shapeFlag & ShapeFlags.ELEMENT) {
		processElement(vnode, container)
	} else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
		processComponent(vnode, container)
	}
}

function processElement(vnode: any, container: any) {
	mountElement(vnode, container)
}

function mountElement(vnode: any, container: any) {
	const el = vnode.el = (document.createElement(vnode.type))
	const { children, props, shapeFlag } = vnode
	if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
		el.textContent = children
	} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
		mountChildren(vnode, el)
	}
	for (const key in props) {
		const val = props[key]
		el.setAttribute(key, val)
	}
	container.append(el)
}
function mountChildren(vnode, container) {
	vnode.children.forEach((v) => {
		patch(v, container)
	})
}

function processComponent(vnode: any, container: any) {
	mountComponent(vnode, container)
}

function mountComponent(initialVNode: any, container: any) {
	// 创建组件实例
	const instance = createComponentInstance(initialVNode)
	setupComponent(instance)
	setupRenderEffect(instance, initialVNode, container)
}

function setupRenderEffect(instance: any, initialVNode: any, container: any) {
  const { proxy } = instance
	// 虚拟节点树
	const subTree = instance.render.call(proxy)
	// initialVNode -> element -> mountElement
	patch(subTree, container)

  initialVNode.el = subTree.el

}
