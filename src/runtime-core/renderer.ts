import { Fragment, Text } from './vnode'
import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { effect } from '../reactivity'
import { EMPTY_OBJ } from '../shared'

export function createRenderer(options) {
	const {
		createElement: hostCreateElement,
		patchProp: hostPatchProp,
		insert: hostInsert
	} = options
	function render(vnode, container) {
		// 调用patch方法
		patch(null, vnode, container, null)
	}

	// n1 老虚拟节点
	// n2 新的
	function patch(n1, n2, container, parentComponent) {
		// 去处理组件
		// 判断是不是element类型
		const { type, shapeFlag } = n2
		switch (type) {
			case Fragment:
				// Fragment -> 只渲染children
				processFragment(n1, n2, container, parentComponent)
				break
			case Text:
				processText(n1, n2, container)
				break
			default:
				if (shapeFlag & ShapeFlags.ELEMENT) {
					processElement(n1, n2, container, parentComponent)
				} else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
					processComponent(n1, n2, container, parentComponent)
				}
				break
		}
	}

	function processText(n1, n2: any, container: any) {
		const { children } = n2
		const textNode = (n2.el = document.createTextNode(children))
		container.append(textNode)
	}

	function processFragment(n1, n2: any, container: any, parentComponent) {
		mountChildren(n2, container, parentComponent)
	}

	function processElement(n1, n2: any, container: any, parentComponent) {
		if (!n1) {
			mountElement(n2, container, parentComponent)
		} else {
			patchElement(n1, n2, container)
		}
	}

	function patchElement(n1, n2, container) {
		console.log('pathElement')
		console.log('n1', n1)
		console.log('n2', n2)

		const oldProps = n1.props || EMPTY_OBJ
		const newProps = n2.props || EMPTY_OBJ

		const el = (n2.el = n1.el)

		patchProps(el, oldProps, newProps)
	}

	function patchProps(el, oldProps, newProps) {
		if (oldProps !== newProps) {
			for (const key in newProps) {
				const prevProp = oldProps[key]
				const nextProp = newProps[key]
				// 获取改变前后的prop 进行更新
				if (prevProp !== nextProp) {
					hostPatchProp(el, key, prevProp, nextProp)
				}
			}
			if (oldProps !== EMPTY_OBJ) {
				for (const key in oldProps) {
					// 如果更新后key不在newProps里 删除
					if (!(key in newProps)) {
						hostPatchProp(el, key, oldProps[key], null)
					}
				}
			}
		}
	}

	function mountElement(n2: any, container: any, parentComponent) {
		const el = (n2.el = hostCreateElement(n2.type))
		const { children, props, shapeFlag } = n2
		if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
			el.textContent = children
		} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			mountChildren(n2, el, parentComponent)
		}
		for (const key in props) {
			const val = props[key]
			hostPatchProp(el, key, null, val)
		}
		// container.append(el)
		hostInsert(el, container)
	}
	function mountChildren(vnode, container, parentComponent) {
		vnode.children.forEach(v => {
			patch(null, v, container, parentComponent)
		})
	}

	function processComponent(n1, n2: any, container: any, parentComponent) {
		mountComponent(n2, container, parentComponent)
	}

	function mountComponent(initialVNode: any, container: any, parentComponent) {
		// 创建组件实例
		const instance = createComponentInstance(initialVNode, parentComponent)
		setupComponent(instance)
    // 设置effect
		setupRenderEffect(instance, initialVNode, container)
	}

	function setupRenderEffect(instance: any, initialVNode: any, container: any) {
		// 调用render时 会触发响应式对象ref/reactive的get收集依赖
    // 响应式对象改变了 会触发内部的函数 自动调用render生成新的subTree
    effect(() => {
			if (!instance.isMounted) {
				const { proxy } = instance
				// 保存当前虚拟节点树 更新时作比较
				const subTree = (instance.subTree = instance.render.call(proxy))
				// initialVNode -> element -> mountElement
				patch(null, subTree, container, instance)

				initialVNode.el = subTree.el

				instance.isMounted = true
			} else {
				const { proxy } = instance
				// 虚拟节点树
				const subTree = instance.render.call(proxy)
				const prevSubTree = instance.subTree
				// 更新subTree
				instance.subTree = subTree

				patch(prevSubTree, subTree, container, instance)
			}
		})
	}

	return {
		createApp: createAppAPI(render)
	}
}
