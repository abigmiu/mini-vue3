let activeEffect = null;
const bucket = new WeakMap(); // 及时回收没有被引用的key

/**
 * target
 *  -- key
 *   -- effectFn
 */

/** 遗留副作用清除 */
function cleanUpEffects(effectFn) {
    /**
     * effect
     *  - deps -> effect
     */
    effectFn.deps.forEach((deps) => {
        deps.delete(effectFn);
    });
    effectFn.deps.length = 0;
}

export function effect(fn) {
    const effectFn = () => {
        cleanUpEffects(effectFn);
        activeEffect = effectFn;
        fn();
    };
    // 这里 给 effectFn 赋值 deps
    effectFn.deps = [];
    effectFn();
}

export function track(target, key) {
    let keyDepsMap = bucket.get(target);

    if (!keyDepsMap) {
        bucket.set(target, (keyDepsMap = new Map()));
    }

    let deps = keyDepsMap.get(key);
    if (!deps) {
        keyDepsMap.set(key, (deps = new Set()));
    }
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
}

export function trigger(target, key) {
    let keyDepsMap = bucket.get(target);
    if (!keyDepsMap) return;
    let deps = keyDepsMap.get(key);
    if (!deps) return;

    // new Set 防止死循环
    const depsToRun = new Set(deps);
    depsToRun.forEach((effect) => effect());
}
