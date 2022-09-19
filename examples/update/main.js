import { createApp } from '../../lib/vue3-mini.esm.js'
import { App } from './App.js'

const rootContainer = document.querySelector('#app')
createApp(App).mount(rootContainer)