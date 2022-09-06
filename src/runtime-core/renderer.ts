import { isObject } from '../shared'
import { createComponentInstance, setupComponent } from './component'

export function render(vnode, container) {
	// 调用patch方法
	patch(vnode, container)
}

function patch(vnode, container) {
	// 去处理组件
	// 判断是不是element类型
	if (typeof vnode.type === 'string') {
		processElement(vnode, container)
	} else if (isObject(vnode.type)) {
		processComponent(vnode, container)
	}
}

function processElement(vnode: any, container: any) {
	mountElement(vnode, container)
}

function mountElement(vnode: any, container: any) {
	const el = vnode.el = (document.createElement(vnode.type))
	const { children, props } = vnode
	if ('string' === typeof children) {
		el.textContent = children
	} else if (Array.isArray(children)) {
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
