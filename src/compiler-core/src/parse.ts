import { NodeTypes } from "./ast"

export function baseParse(content: string) {
	const context = createParserContext(content)

	return createRoot(parseChildren(context))
}

function parseChildren(context) {
	const nodes: any = []
  let node
  if (context.source.startsWith('{{')) {
    // 插值类型
    node = parseInterpolation(context)
  }
	nodes.push(node)
	return nodes
}

function parseInterpolation(context) {
	// 解析插值
	// {{ message }}
	const openDelimiter = '{{'
	const closeDelimiter = '}}'

	// 寻找后面的 }}
	const closeIndex = context.source.indexOf(
		closeDelimiter,
		closeDelimiter.length
	)
  // 推进指针
  // 也就是执行删除
	// 去除前面的 {{
  advanceBy(context, openDelimiter.length)

	// 截取
	const rawContentLength = closeIndex - openDelimiter.length
	const rawContent = context.source.slice(0, rawContentLength)
  const content = rawContent.trim()

	// 处理后需要删除掉
  advanceBy(context, rawContentLength + closeDelimiter.length)
	return {
		type: NodeTypes.INTERPOLATION,
		content: {
			type: NodeTypes.SIMPLE_EXPRESSION,
			content
		}
	}
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length)
}

function createRoot(children) {
	return {
		children
	}
}

function createParserContext(content: string): any {
	return {
		source: content
	}
}
