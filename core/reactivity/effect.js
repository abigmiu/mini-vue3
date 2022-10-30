let activeEffect = null;
const effectStack = [];
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

export function effect(
    fn,
    options = {
        scheduler: null,
        lazy: false,
    }
) {
    const effectFn = () => {
        cleanUpEffects(effectFn);
        activeEffect = effectFn;
        effectStack.push(effectFn);
        const res = fn();
        console.log('res', res);
        // 将当前副作用函数弹出
        effectStack.pop();
        // 恢复到之前的值
        activeEffect = effectStack[effectStack.length - 1];

        return res;
    };
    // 这里 给 effectFn 赋值 deps
    effectFn.deps = [];
    effectFn.options = options;
    if (options.lazy) {
        return effectFn;
    }
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
    if (!activeEffect) return;
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
}

function triggerEffects(deps) {
    deps.forEach((effect) => {
        if (effect.options.scheduler) {
            effect.options.scheduler(effect);
        } else {
            effect();
        }
    });
}

export function trigger(target, key) {
    let keyDepsMap = bucket.get(target);
    if (!keyDepsMap) return;
    let deps = keyDepsMap.get(key);
    if (!deps) return;

    // new Set 防止死循环
    const depsToRun = new Set();
    deps.forEach((effect) => {
        if (activeEffect !== effect) {
            depsToRun.add(effect);
        }
    });
    triggerEffects(depsToRun);
}
