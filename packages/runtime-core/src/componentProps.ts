export function initProps(instance, rawProps) {
  // 将props赋值给instance.props
  console.log('初始化 props')
  // TODO
  // 应该还有 attrs 的概念
  // attrs
  // 如果组件声明了 props 的话，那么才可以进入 props 属性内
  // 不然的话是需要存储在 attrs 内
  instance.props = rawProps || {}
}
