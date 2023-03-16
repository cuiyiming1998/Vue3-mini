import { h } from '../../dist/vue3-mini.esm.js'
import { Foo } from './Foo.js'

export const App = {
  render() {
    return h('div', {}, [
      h('div', {}, 'App'),
      h(Foo, {
        onAdd(a, b) {
          console.log('onAdd', a, b)
        },
        onAddFoo(a, b) {
          console.log('onAddFoo', a, b)
        },
      }),
    ])
  },

  setup() {
    return {}
  },
}
