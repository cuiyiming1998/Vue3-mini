import { h } from '../../dist/vue3-mini.esm.js'

export const Foo = {
  setup(props) {
    console.log(props)
    // shallowReadonly -> warn
    props.count++
  },

  render() {
    return h('div', {}, `foo:${this.count}`)
  },
}
