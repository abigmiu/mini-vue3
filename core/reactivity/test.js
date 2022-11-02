import { effect } from './effect.js'
import { reactive } from './reactive.js'

const obj = reactive({
    foo: 'foo in',
})

const fn = () => {
    for (const k in obj) {}
}
effect(fn)
obj.bar = 1
