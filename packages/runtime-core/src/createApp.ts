import { createVNode } from './vnode'

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    // rootComponent根组件
    return {
      mount(rootContainer) {
        // component -> vnode
        // 所有的逻辑操作 都会基于vnode
        // 创建根组件vnode
        console.log('基于根组件创建 vnode')
        const vnode = createVNode(rootComponent)
        // 渲染
        console.log('调用 render，基于 vnode 进行开箱')
        render(vnode, rootContainer)
      },
    }
  }
}
