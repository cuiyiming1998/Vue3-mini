import { baseCompile } from '@vue3-mini/compiler-core'
import * as runtimeDom from '@vue3-mini/runtime-dom'
import { registerRuntimeCompiler } from '@vue3-mini/runtime-dom'
// 出口文件
export * from '@vue3-mini/runtime-dom'

function compileToFunction(template) {
  const { code } = baseCompile(template)
  const render = new Function('Vue', code)(runtimeDom)
  console.log('生成render函数---------------------------------------', render)
  return render
}

registerRuntimeCompiler(compileToFunction)
