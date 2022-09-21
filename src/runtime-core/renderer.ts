import { Fragment, Text } from './vnode'
import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { createAppAPI } from './createApp'
import { effect } from '../reactivity'
import { EMPTY_OBJ } from '../shared'

export function createRenderer(options) {
  // 传入自定义渲染方法
	const {
		createElement: hostCreateElement,
		patchProp: hostPatchProp,
		insert: hostInsert,
		remove: hostRemove,
		setElementText: hostSetElementText
	} = options
	function render(vnode, container) {
		// 调用patch方法
    // 一开始没有n1新节点 传null
		patch(null, vnode, container, null)
	}

	// n1 老节点
	// n2 新节点
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
				// Text -> 渲染为textNode节点
				processText(n1, n2, container)
				break
			default:
				if (shapeFlag & ShapeFlags.ELEMENT) {
					// 处理element类型
					processElement(n1, n2, container, parentComponent)
				} else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
					// 处理component类型
					processComponent(n1, n2, container, parentComponent)
				}
				break
		}
	}

	function processText(n1, n2: any, container: any) {
    // 如果是text类型 则children为text: string
		const { children } = n2
    // 创建textNode 并赋值给el
		const textNode = (n2.el = document.createTextNode(children))
    // append到container上
		container.append(textNode)
	}

	function processFragment(n1, n2: any, container: any, parentComponent) {
    // 如果是Fragment类型 就跳过当前节点 直接mount他的子节点children
		mountChildren(n2.children, container, parentComponent)
	}

	function processElement(n1, n2: any, container: any, parentComponent) {
		if (!n1) {
      // 如果没有老节点 则直接mount新节点
			mountElement(n2, container, parentComponent)
		} else {
      // 有老节点 调用patchElement进行对比
			patchElement(n1, n2, container, parentComponent)
		}
	}

	function patchElement(n1, n2, container, parentComponent) {
		console.log('pathElement')
		console.log('n1', n1)
		console.log('n2', n2)

		const oldProps = n1.props || EMPTY_OBJ
		const newProps = n2.props || EMPTY_OBJ

		// 获取el 供hostPatchProps使用
		const el = (n2.el = n1.el)

		// 更新子节点children
		patchChildren(n1, n2, el, parentComponent)
		// 更新props
		patchProps(el, oldProps, newProps)
	}

	function patchChildren(n1, n2, container, parentComponent) {
		const prevShapeFlag = n1.shapeFlag
		const c1 = n1.children
		const { shapeFlag } = n2
		const c2 = n2.children
		// 进行对比新老children
		if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
			// 新节点为textChildren类型
			if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
				// 老节点为arrayChildren
				// 1. 把老节点的children清空
				unmountChildren(n1.children)
			}
      // 2. 设置新的text
			if (c1 !== c2) {
				hostSetElementText(container, c2)
			}
		} else {
      // 新节点为array类型
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 老节点为text
        // 1. 清空text
        hostSetElementText(container, '')
        // 2. mountChildren
        mountChildren(c2, container, parentComponent)
      }
    }
	}

	function unmountChildren(children) {
		// 循环children 删除子节点
		for (let i = 0; i < children.length; i++) {
			const el = children[i].el
			hostRemove(el)
		}
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
    // 创建element节点
		const el = (n2.el = hostCreateElement(n2.type))
		const { children, props, shapeFlag } = n2
		if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果是text 赋值给el.textContent
			el.textContent = children
		} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 如果是array类型 调用mountChildren
			mountChildren(n2.children, el, parentComponent)
		}
    // 循环节点的props 进行props的赋值
		for (const key in props) {
			const val = props[key]
			hostPatchProp(el, key, null, val)
		}
    // 生成真实DOM 添加到页面中
		hostInsert(el, container)
	}
	function mountChildren(children, container, parentComponent) {
    // 循环children, 再次调用patch
		children.forEach(v => {
			patch(null, v, container, parentComponent)
		})
	}

	function processComponent(n1, n2: any, container: any, parentComponent) {
		mountComponent(n2, container, parentComponent)
	}

	function mountComponent(initialVNode: any, container: any, parentComponent) {
		// 创建组件实例
		const instance = createComponentInstance(initialVNode, parentComponent)
    // 初始化组件
		setupComponent(instance)
		// 设置effect 收集依赖 获取subTree虚拟节点树
		setupRenderEffect(instance, initialVNode, container)
	}

	function setupRenderEffect(instance: any, initialVNode: any, container: any) {
		// 调用render时 会触发响应式对象ref/reactive的get收集依赖
		// 响应式对象改变了 会触发内部的函数 自动调用render生成新的subTree
		effect(() => {
			if (!instance.isMounted) {
				const { proxy } = instance
				// 保存当前虚拟节点树 更新时作比较
        // 初次调用时instance.subtree为 {} 获取的subTree要赋值到instance上
        // 这里调用了render 会触发reactive ref...等的依赖收集
				const subTree = (instance.subTree = instance.render.call(proxy))

        // 获取subTree后再次调用patch渲染子节点
				patch(null, subTree, container, instance)

        // 更新el
				initialVNode.el = subTree.el

        // 更新instance的状态为isMounted 依赖变更时进入else分支
				instance.isMounted = true
			} else {
        // 响应式对象发生改变时会进到这里
				const { proxy } = instance
				// 获取虚拟节点树
				const subTree = instance.render.call(proxy)
				const prevSubTree = instance.subTree
				// 更新subTree
				instance.subTree = subTree

        // 新旧虚拟节点数进行对比, 重新patch
				patch(prevSubTree, subTree, container, instance)
			}
		})
	}

	return {
		createApp: createAppAPI(render)
	}
}
