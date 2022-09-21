import { ShapeFlags } from './../shared/shapeFlags';
export function initSlots(instance, children) {
  // 初始化slots
  const { vnode } = instance
  // 判断当前节点类型是否为slotChildren
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots)
  }
}

function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    const value = children[key]
    // 父组件是 header: (age) => h('div', {}, age) 传参
    // value需要执行下value(props)才能得到返回结果
    // 在renderSlots时需要用函数调用的方式获取prop 所以slots[key]也是一个函数的形式
    slots[key] = (props) => normalizeSlotValue(value(props))
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value]
}