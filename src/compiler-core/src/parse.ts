import { NodeTypes } from "./ast"

const enum TagType {
  Start,
  End
}

export function baseParse(content: string) {
	const context = createParserContext(content)

	return createRoot(parseChildren(context))
}

function parseChildren(context) {
	const nodes: any = []
  let node
  const s = context.source
  if (s.startsWith('{{')) {
    // 插值类型
    node = parseInterpolation(context)
  } else if ('<' === s[0]) {
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context)
    }
  }
  // 如果node没有值 需要把它当成text来解析
  if (!node) {
    node = parseText(context)
  }
	nodes.push(node)
	return nodes
}

function parseText(context: any): any {
  const content = parseTextData(context, context.source.length)
  return {
    type: NodeTypes.TEXT,
    content
  }
}


function parseTextData(context: any, length: number) {
  // 1. 获取content
  const content = context.source.slice(0, length)
  // 2. 推进
  advanceBy(context, length)
  return content
}

function parseElement(context: any) {
  // 解析element
  // 这里删除了左侧的<div>
  const element = parseTag(context, TagType.Start)
  // 再次调用删除</div>
  parseTag(context, TagType.End)
  return element
}

function parseTag(context: any, type: TagType) {
  // 1. 解析tag
  // < 开头 a-z忽略大小写
  const match: any = /^<\/?([a-z]*)/i.exec(context.source)
  const tag = match[1]
  // 2. 删除处理完成的代码
  advanceBy(context, match[0].length)
  // 再删除剩下的 >
  advanceBy(context, 1)
  if (TagType.End === type) {
    return
  }
  return {
    type: NodeTypes.ELEMENT,
    tag
  }
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
	const rawContent = parseTextData(context, rawContentLength)
  const content = rawContent.trim()

	// 处理后需要删除掉
  advanceBy(context, closeDelimiter.length)
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

