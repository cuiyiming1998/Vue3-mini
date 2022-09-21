import { camelize, toHandlerKey } from "../shared"

/**
 * description
 * emit方法
 *
 * @param instance 当前实例
 * @param event 事件名
 * @param args 传递的参数
 * @return void
 *
 */
export function emit(instance, event, ...args) {
  // 如果要调用emit 则props里需要有onXXX这个Prop
  // 找到instance.props -> 寻找event
  const { props } = instance

  // 格式化event名称 将add-two / addTwo转化成 onAddTwo
  const handlerName = toHandlerKey(camelize(event))
  // 在Props里寻找转化后的propName
  const handler = props[handlerName]
  // 如果寻找到了就去执行
  handler && handler(...args)
}