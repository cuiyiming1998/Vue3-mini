import { h } from "../../lib/vue3-mini.esm.js"

export const Foo = {
  setup(props) {
    // shallowReadonly -> warn
    props.count ++
  },

  render() {
    return h('div', {}, 'foo:' + this.count)
  }
}