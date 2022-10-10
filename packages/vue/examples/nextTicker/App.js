import {
	h,
	ref,
	getCurrentInstance,
	nextTick
} from '../../dist/vue3-mini.esm.js'

export const App = {
	name: 'App',
	setup() {
		const count = ref(1)
		const instance = getCurrentInstance()

		function onClick() {
			for (let i = 0; i < 100; i++) {
				console.log('update')
				count.value = i
			}

      // 拿不到视图的变更
			console.log(instance)
			nextTick(() => {
				console.log(instance)
			})

		}

		return {
			onClick,
			count
		}
	},
	render() {
		const button = h('button', { onClick: this.onClick }, 'update')
		const p = h('p', {}, 'count:' + this.count)

		return h('div', {}, [button, p])
	}
}
