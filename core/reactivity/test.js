import { reactive } from './reactive.js';
import { effect } from './effect.js';
let text;
const obj = reactive({
    ok: true,
    text: 'hello',
});
const fn = () => {
    text = obj.ok ? obj.text : 'sorry';
};
effect(fn);
console.log(text);
obj.ok = false;
console.log(text);
obj.text = 'change';
