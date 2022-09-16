import { Fragment, Text } from './vnode'
import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'

export function createRenderer(options) {
	const {
		createElement: hostCreateElement,
		patchProp: hostPatchProp,
		insert: hostInsert
	} = options
	function render(vnode, container) {
		// 调用patch方法
		patch(vnode, container, null)
	}

	function patch(vnode, container, parentComponent) {
		// 去处理组件
		// 判断是不是element类型
		const { type, shapeFlag } = vnode
		switch (type) {
			case Fragment:
				// Fragment -> 只渲染children
				processFragment(vnode, container, parentComponent)
				break
			case Text:
				processText(vnode, container)
				break
			default:
				if (shapeFlag & ShapeFlags.ELEMENT) {
					processElement(vnode, container, parentComponent)
				} else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
					processComponent(vnode, container, parentComponent)
				}
				break
		}
	}

	function processText(vnode: any, container: any) {
		const { children } = vnode
		const textNode = (vnode.el = document.createTextNode(children))
		container.append(textNode)
	}

	function processFragment(vnode: any, container: any, parentComponent) {
		mountChildren(vnode, container, parentComponent)
	}

	function processElement(vnode: any, container: any, parentComponent) {
		mountElement(vnode, container, parentComponent)
	}

	function mountElement(vnode: any, container: any, parentComponent) {
		const el = (vnode.el = hostCreateElement(vnode.type))
		const { children, props, shapeFlag } = vnode
		if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
			el.textContent = children
		} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			mountChildren(vnode, el, parentComponent)
		}
		for (const key in props) {
			const val = props[key]
			hostPatchProp(el, key, val)
		}
		// container.append(el)
		hostInsert(el, container)
	}
	function mountChildren(vnode, container, parentComponent) {
		vnode.children.forEach(v => {
			patch(v, container, parentComponent)
		})
	}

	function processComponent(vnode: any, container: any, parentComponent) {
		mountComponent(vnode, container, parentComponent)
	}

	function mountComponent(initialVNode: any, container: any, parentComponent) {
		// 创建组件实例
		const instance = createComponentInstance(initialVNode, parentComponent)
		setupComponent(instance)
		setupRenderEffect(instance, initialVNode, container)
	}

	function setupRenderEffect(instance: any, initialVNode: any, container: any) {
		const { proxy } = instance
		// 虚拟节点树
		const subTree = instance.render.call(proxy)
		// initialVNode -> element -> mountElement
		patch(subTree, container, instance)

		initialVNode.el = subTree.el
	}

	return {
		createApp: createAppAPI(render)
	}
}
