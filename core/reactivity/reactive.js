import { track, trigger, triggerType } from './effect.js';
import { equal } from '../util'

export let ITERATE_KEY = Symbol()

function createReactive(obj, isShallow = false, isReadonly = false) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            const res = Reflect.get(target, key, receiver);
            if (!isReadonly) {
                track(target, key);
            }


            if (isShallow) {
                return res;
            }

            if (typeof res === 'object' && res !== null) {
                return isReadonly ? readonly(res) : reactive(res)
            }
            return res;
        },
        // 拦截 key in obj
        has(target, key, receiver) {
            const res = Reflect.has(target, key, receiver);
            track(target, key);
            return res;
        },
        set(target, key, newVal, receiver) {
            if (isReadonly) {
                console.warn(`${key} is Readonly`);
                return true;
            }

            const oldVal = target[key]
            /*  当对象为数组时:
                - key 为索引值
                - key < target.length => 不会影响数组长度 => SET 操作
                - key >= target.length => 会影响数组长度 => ADD 操作
            * */
            const type = Array.isArray(target) ?
                parseInt(key, 10) >= target.length
                    ? triggerType.ADD
                    : triggerType.SET
                : target.hasOwnProperty(key)
                    ? triggerType.SET
                    : triggerType.ADD

            const res = Reflect.set(target, key, newVal, receiver);
            if (!equal(oldVal, newVal)) {
                trigger(target, key, type);
            }

            return res;
        },
        // 拦截 for ... in
        ownKeys(target) {
            // 因为 for...in 针对的是对象所有属性，所以无法用某个 key 来进行追踪
            // 故这里使用 Symbol 来作为 for...in 追踪的唯一标识
            // target - iterate_key - effect
            track(target, ITERATE_KEY)
            return Reflect.ownKeys(target)
        },
        deleteProperty(target, key) {
            if (isReadonly) {
                console.warn(`${key} is Readonly`);
                return true;
            }
            const hasKey = target.hasOwnProperty(key)
            const res = Reflect.deleteProperty(target, key)

            if (hasKey && res) {
                trigger(target, key, triggerType.DELETE)
            }
            return res
        }

    });
}

export function reactive(obj) {
    return createReactive(obj);
}

export function shallowReactive(obj) {
    return createReactive(obj, true)
}

export function readonly(obj) {
    return createReactive(obj, false, true)
}
export function shallowReadonly(obj) {
    return createReactive(obj, true, true)
}
