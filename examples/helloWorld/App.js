import { h } from '../../lib/vue3-mini.esm.js'

export const App = {
	render() {
		return h(
			'div',
			{
				id: 'root',
				class: ['red', 'hard']
			},
      [
        h('p', { class: 'red' }, 'HELLO'),
        h('p', { class: 'blue' }, 'WORLD')
      ]
		)
	},

	setup() {
		// composition api
		return {
			msg: 'hello world'
		}
	}
}
