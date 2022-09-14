import { camelize, toHandlerKey } from "../shared"

export function emit(instance, event, ...args) {
  // 找到instance.props -> 寻找event
  const { props } = instance

  // add -> Add


  const handlerName = toHandlerKey(camelize(event))
  const handler = props[handlerName]
  handler && handler(...args)
}