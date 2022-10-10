import { h, getCurrentInstance } from '../../dist/vue3-mini.esm.js'
import { Foo } from './Foo.js'

export const App = {
  name: 'App',
  render() {
    return h('div', {}, [h('p', {}, 'currentInstanceDemo'), h(Foo)])
  },

  setup() {
    const instance = getCurrentInstance()
    console.log('App:', instance)
  }
}