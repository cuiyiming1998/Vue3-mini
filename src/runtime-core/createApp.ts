import { createVNode } from './vnode'

export function createAppAPI(render) {
	return function createApp(rootComponent) {
    // rootComponent根组件
		return {
			mount(rootContainer) {
				// component -> vnode
				// 所有的逻辑操作 都会基于vnode
        // 创建根组件vnode
				const vnode = createVNode(rootComponent)
        // 渲染
				render(vnode, rootContainer)
			}
		}
	}
}
