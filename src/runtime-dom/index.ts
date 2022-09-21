import { createRenderer } from '../runtime-core'

function createElement(type) {
	return document.createElement(type)
}

function patchProp(el, key, prevVal, nextVal) {
	const isOn = (key: string) => /^on[A-Z]/.test(key)
	if (isOn(key)) {
		const event = key.slice(2).toLocaleLowerCase()
		el.addEventListener(event, nextVal)
	} else {
    // 如果prop删除了(赋值undefined或null) 则removeAttr
    if (undefined === nextVal || null === nextVal) {
      el.removeAttribute(key, nextVal)
    } else {
      el.setAttribute(key, nextVal)
    }
	}
}

function insert(el, parent) {
	parent.append(el)
}

function remove(child) {
  // 删除当前元素
  const parent = child.parentNode
  if (parent) {
    parent.removeChild(child)
  }
}

function setElementText(el, text) {
  // 设置text节点
  el.textContent = text
}

const renderer: any = createRenderer({
	createElement,
	patchProp,
	insert,
  remove,
  setElementText
})

export function createApp(...args) {
  return renderer.createApp(...args)
}


export * from '../runtime-core'