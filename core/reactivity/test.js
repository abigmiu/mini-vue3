import { effect } from './effect.js'
import { reactive } from './reactive.js'

const arr = reactive([1, 2, 3])
const fn1 = () => arr[0]
const fn2 = () => arr[1]
const fn3 = () => arr[2]

effect(fn1)
effect(fn2)
effect(fn3)

arr.length = 1
