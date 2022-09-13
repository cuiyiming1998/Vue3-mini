import { h } from "../../lib/vue3-mini.esm.js"

export const Foo = {
  setup(props) {
    // shallowReadonly -> warn
    console.log(props)
    props.count ++
  },

  render() {
    return h('div', {}, 'foo:' + this.count)
  }
}