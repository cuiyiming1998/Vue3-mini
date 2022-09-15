import { h, createTextVnode } from '../../lib/vue3-mini.esm.js'
import { Foo } from './Foo.js'

export const App = {
	name: 'App',
	render() {
		const app = h('div', {}, 'App')
		const foo = h(
			Foo,
			{},
			{
				header: ({ age }) => [
					h('p', {}, 'header' + age),
					createTextVnode('你好')
				],
				footer: () => h('p', {}, 'footer')
			}
		)

		return h('div', {}, [app, foo])
	},

	setup() {
		return {}
	}
}
