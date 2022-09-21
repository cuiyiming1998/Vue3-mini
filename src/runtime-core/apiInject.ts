import { getCurrentInstance } from "./component";

export function provide(key, value) {
  // 存
  // 获取当前组件实例
  const currentInstance: any = getCurrentInstance()
  if (currentInstance) {
    let { provides } = currentInstance

    // 更改prototype 使provide能够嵌套使用
    // 如果parent没有 则向上寻找
    const parentProvides = currentInstance.parent.provides
    if (provides === parentProvides) {
      // 如果第一次 则通过继承父provides进行初始化
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    provides[key] = value
  }
}

export function inject(key, defaultValue) {
  // 取
  const currentInstance: any = getCurrentInstance()
  if (currentInstance) {
    // 因为provides是层层继承的 所以只需找到parent的provide 即为所有的provides
    const parentProvides = currentInstance.parent.provides
    if (key in parentProvides) {
      return parentProvides[key]
    } else if (defaultValue) {
      // 如果没有找到 且有default 则赋值
      if (typeof defaultValue === 'function') {
        return defaultValue()
      }
      return defaultValue
    }
  }
}