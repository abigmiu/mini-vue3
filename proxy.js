const bucker = new Set();
const data = {
    text: 'hello world',
};

const obj = new Proxy(data, {
    get(target, key) {
        bucker.add(effect);
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        bucker.forEach((fn) => fn());
        return true;
    },
});

function effect() {
    document.body.innerText = obj.text;
}

effect();

setTimeout(() => {
    obj.text = 'hello vue3';
}, 1000);
