import { reactive } from './reactive.js';
import { effect } from './effect.js';

const obj = reactive({foo: 1, bar: 2})
effect(() => {
    console.log('before effect run')
    console.log('bar', obj.bar)
    // 同时 get + set -> 在运行当前 effect 未结束时，又调用了当前 effect
    const res = obj.foo + 1
    obj.foo = res
})
