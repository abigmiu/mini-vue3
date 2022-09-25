const bucker = new WeakMap();
const data = {
    text: 'hello world',
};

function cleanup(effectFn) {
    effectFn.deps.forEach((dep) => {
        const deps = dep;
        deps.delete(effectFn);
    });
    effectFn.deps.length = 0;
}

let activeEffect;
const effectStack = [];
function effect(fn, options = {}) {
    const effectFn = () => {
        cleanup(effectFn);
        activeEffect = effectFn;
        effectStack.push(effectFn);
        const res = fn();
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
        return res;
    };
    effectFn.options = options;
    effectFn.deps = [];

    if (!options.lazy) {
        effectFn();
    }

    return effectFn;
}

function track(target, key) {
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
    activeEffect.deps.push(deps);
}

function trigger(target, key) {
    const depsMap = bucker.get(target);
    if (!depsMap) return;

    const effects = depsMap.get(key);
    debugger;
    // effects.forEach((effectFn) => effectFn()); 这样会死循环
    const effectsToRun = new Set();

    effects &&
        effects.forEach((effectFn) => {
            if (effectFn !== activeEffect) {
                effectsToRun.add(effectFn);
            }
        });

    effectsToRun.forEach((effectFn) => {
        if (effectFn.options.scheduler) {
            effectFn.options.scheduler(effectFn);
        } else {
            effectFn();
        }
    });
}

function computed(getter) {
    let value;
    let dirty = true;

    const effectFn = effect(getter, {
        lazy: true,
        scheduler() {
            dirty = true;
            trigger(obj, value);
        },
    });

    const obj = {
        get value() {
            if (dirty) {
                value = effectFn();
                dirty = false;
            }
            track(obj, value);
            return value;
        },
    };

    return obj;
}

function watch(source, cb) {
    let getter;
    if (typeof source === 'function') {
        getter = source;
    } else {
        getter = () => traverse(source);
    }
    effect(() => traverse(source), {
        scheduler() {
            cb();
        },
    });
}

function traverse(value, seen = new Set()) {
    if (typeof value !== 'object' || value === null || seen.has(value)) return;

    seen.add(value);

    for (const k in value) {
        traverse(value[k], seen);
    }

    return value;
}

const obj = new Proxy(data, {
    get(target, key) {
        track(target, key);
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;

        trigger(target, key);
    },
});

effect(() => {
    console.log('effect dn');
    document.body.innerText = obj.text;
});

setTimeout(() => {
    obj.text = 'hello vue3';
}, 1000);
