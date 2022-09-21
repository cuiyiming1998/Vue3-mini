import { createVNode, Fragment } from "../vnode";

export function renderSlots(slots, name, props) {
  // 寻找slots[name]
  // 如果存在 则使用Fragment创建虚拟节点 传入Props
  const slot = slots[name]
  if (slot) {
    if (typeof slot === 'function') {
      return createVNode(Fragment, {}, slot(props))
    }
  }
}
