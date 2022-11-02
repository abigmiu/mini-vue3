import { reactive } from './reactive.js'
import { watch } from './watch.js'
const obj = reactive({
    foo: 1,
});
const cb = () => obj.foo;
watch(obj, cb);
obj.foo++;
