let activeEffect = null;
const bucket = new WeakMap(); // 及时回收没有被引用的key

/**
 * target
 *  -- key
 *   -- effectFn
 */


export function effect(fn) {
    activeEffect = fn;
    fn();
}

export function track(target, key) {
    let keyDepsMap = bucket.get(target);

    if (!keyDepsMap) {
        bucket.set(target, keyDepsMap = new Map());
    }

    let deps = keyDepsMap.get(key);
    if (!deps) {
        keyDepsMap.set(key, deps = new Set());
    }
    deps.add(activeEffect);
}

export function trigger(target, key) {
    let keyDepsMap = bucket.get(target);
    if (!keyDepsMap) return;
    let deps = keyDepsMap.get(key);
    if (!deps) return;
    deps.forEach(effect => effect());
}