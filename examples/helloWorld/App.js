import { h } from '../../lib/vue3-mini.esm.js'

window.self = null
export const App = {
	render() {
    window.self = this
		return h(
			'div',
			{
				id: 'root',
				class: ['red', 'hard'],
        onClick() {
          console.log('click')
        },
        onMouseDown() {
          console.log('down')
        }
			},
      'hello' + this.msg
      // [
      //   h('p', { class: 'red' }, 'HELLO'),
      //   h('p', { class: 'blue' }, 'WORLD')
      // ]
		)
	},

	setup() {
		// composition api
		return {
			msg: 'hello world'
		}
	}
}
