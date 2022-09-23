import { ShapeFlags } from './../shared/shapeFlags'
export function initSlots(instance, children) {
	// 初始化slots
	const { vnode } = instance
	console.log('初始化 slots')
	// 判断当前节点类型是否为slotChildren
	if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
		normalizeObjectSlots(children, instance.slots)
	}
}

function normalizeSlotValue(value) {
	// 把 function 返回的值转换成 array ，这样 slot 就可以支持多个元素了
	return Array.isArray(value) ? value : [value]
}

function normalizeObjectSlots(children, slots) {
	for (const key in children) {
		const value = children[key]
		// 父组件是 header: (age) => h('div', {}, age) 传参
		// value需要执行下value(props)才能得到返回结果
		// 在renderSlots时需要用函数调用的方式获取prop 所以slots[key]也是一个函数的形式
		slots[key] = props => normalizeSlotValue(value(props))
	}
}
