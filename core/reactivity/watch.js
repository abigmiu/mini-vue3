import { effect } from './effect.js';

/**
 * 递归读取， 收集依赖
 */
function traverse(value, seen = new Set()) {
    if (typeof value !== 'object' || value === null || seen.has(value)) {
        return;
    }
    // 防止循环引用造成死循环
    seen.add(value);

    for (const key in value) {
        traverse(value[key], seen);
    }

    return value;
}

export function watch(source, callback, options = {
    immediate: false,
}) {
    let getter;
    let newVal, oldVal
    if (typeof source === 'function') {
        getter = source;
    } else {
        getter = () => traverse(source);
    }

    let cleanup
    function onInvalidate(fn) {
        cleanup = fn
    }

    const job = () => {
        newVal = effectFn()
        if (cleanup) {
            cleanup()
        }
        callback(newVal, oldVal, onInvalidate);
        oldVal = newVal
    }

    const effectFn = effect(getter, {
        lazy: true, // 用 lazy 是为了返回函数给 effectFn
        scheduler() {
            job();
        },
    });
    if (options.immediate) {
        job();
    } else {
        oldVal = effectFn(); // 手动调用获取第一次的值（绑定依赖）
    }

}
