const bucker = new WeakMap();
const data = {
    text: 'hello world',
};

let activeEffect;
function effect(fn) {
    activeEffect = fn;
    fn();
}

const obj = new Proxy(data, {
    get(target, key) {
        if (!activeEffect) return target[key];

        let depsMap = bucker.get(target);
        if (!depsMap) {
            depsMap = new Map();
            bucker.set(target, depsMap);
        }

        let deps = depsMap.get(key);
        if (!deps) {
            deps = new Set();
            depsMap.set(key, deps);
        }

        deps.add(activeEffect);

        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;

        const depsMap = bucker.get(target);
        if (!depsMap) return;

        const effects = depsMap.get(key);

        effects && effects.forEach((fn) => fn());
    },
});

effect(() => {
    console.log('effect dn');
    document.body.innerText = obj.text;
});

setTimeout(() => {
    obj.noExitProperty = 'hello vue3';
}, 1000);
