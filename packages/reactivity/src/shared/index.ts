export const extend = Object.assign

export const isObject = (val) => {
  return null !== val && 'object' === typeof val
}

export const hasChanged = (value, newValue) => {
  return !Object.is(value, newValue)
}