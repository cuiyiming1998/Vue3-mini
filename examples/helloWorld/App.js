import { h } from '../../lib/vue3-mini.esm.js'
import { Foo } from './Foo.js'

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
			[h('div', {}, 'hi' + this.msg), h(Foo, { count: 1 })]
			// 'hello' + this.msg
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
