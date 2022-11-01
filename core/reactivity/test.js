import { reactive } from './reactive.js';
import { effect } from './effect.js';
import { computed } from './computed.js';

const obj = reactive({
    foo: 1,
});
const bar = computed(() => {
    console.log('computed');
    obj.foo;
});
effect(() => {
    console.log('effect');
    bar.value;
});
obj.foo++;
