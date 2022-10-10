export * from './toDisplayString'
export * from './shapeFlags'

export const extend = Object.assign
export const EMPTY_OBJ = {}

export const isObject = val => {
	return val !== null && typeof val === 'object'
}

export const hasChanged = (value, newValue) => {
	return !Object.is(value, newValue)
}

export const hasOwn = (val, key) => {
	return Object.prototype.hasOwnProperty.call(val, key)
}

// 横杠转驼峰add-foo -> addFoo
export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : ''
  })
}

// 首字母大写
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// 驼峰加on
export const toHandlerKey = (str: string) => {
  return str ? 'on' + capitalize(str) : ''
}

export const isString = (val) => { return typeof val === 'string' }