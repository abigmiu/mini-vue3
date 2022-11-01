import { effect } from './effect';

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

export function watch(source, callback) {
    effect(() => traverse(source), {
        scheduler() {
            callback();
        },
    });
}
