import { CREATE_ELEMENT_VNODE } from './runtimeHelpers'

export const enum NodeTypes {
	INTERPOLATION,
	SIMPLE_EXPRESSION,
	ELEMENT,
	TEXT,
	ROOT,
	COMPOUND_EXPRESSION
}

export function createVNodeCall(context, tag, props, children) {
	context.helper(CREATE_ELEMENT_VNODE)
	const vnodeElement = {
		type: NodeTypes.ELEMENT,
		tag,
		props,
		children
	}
	return vnodeElement
}
