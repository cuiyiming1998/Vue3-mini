import { baseCompile } from './compiler-core/src'
import * as runtimeDom from './runtime-dom'
import { registerRuntimeCompiler } from './runtime-dom'
// 出口文件
export * from './runtime-dom'


function compileToFunction(template) {
	const { code } = baseCompile(template)
	const render = new Function('Vue', code)(runtimeDom)
  console.log('生成render函数---------------------------------------', render)
	return render
}

registerRuntimeCompiler(compileToFunction)
