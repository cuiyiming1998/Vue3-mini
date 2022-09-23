import { createRenderer } from '../runtime-core'

function createElement(type) {
  // 创建element
	return document.createElement(type)
}

function patchProp(el, key, prevVal, nextVal) {
  // 处理prop
  // 如果是on开头的 则添加eventListener

  console.log(`PatchProp 设置属性:${key} 值:${nextVal}`);
  console.log(`key: ${key} 之前的值是:${prevVal}`);

	const isOn = (key: string) => /^on[A-Z]/.test(key)
	if (isOn(key)) {
    const event = key.slice(2).toLocaleLowerCase()
		el.addEventListener(event, nextVal)
	} else {
    // 其余的是attribute
    if (undefined === nextVal || null === nextVal) {
      // 如果prop删除了(赋值undefined或null) 则removeAttr
      el.removeAttribute(key, nextVal)
    } else {
      el.setAttribute(key, nextVal)
    }
	}
}

function insert(child, parent, anchor) {
  // 添加到DOM的方法
  parent.insertBefore(child, anchor || null)
}

function remove(child) {
  // 删除的方法
  // 寻找parentNode
  // 通过parentNode.removeChild删除
  const parent = child.parentNode
  if (parent) {
    parent.removeChild(child)
  }
}

function setElementText(el, text) {
  // 设置text节点
  el.textContent = text
}

function createText(text) {
  return document.createTextNode(text);
}

function setText(node, text) {
  node.nodeValue = text;
}

// 默认HTML DOM中的render
const renderer: any = createRenderer({
	createElement,
	patchProp,
	insert,
  remove,
  setElementText,
  createText,
  setText
})

export function createApp(...args) {
  // main.js使用的createApp在这里
  return renderer.createApp(...args)
}


export * from '../runtime-core'