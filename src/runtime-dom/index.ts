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

const renderer: any = createRenderer({
	createElement,
	patchProp,
	insert
})

export function createApp(...args) {
  return renderer.createApp(...args)
}


export * from '../runtime-core'