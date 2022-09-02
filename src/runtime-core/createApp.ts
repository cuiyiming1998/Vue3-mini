import { render } from "./renderer"
import { createVNode } from "./vnode"

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // component -> vnode
      // 所有的逻辑操作 都会基于vnode
      const vnode = createVNode(rootComponent)

      render(vnode, rootContainer)
    }
  }
}
