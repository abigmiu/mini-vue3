import { track, trigger, triggerType } from './effect.js';
import { equal } from '../util.js'

export let ITERATE_KEY = Symbol()
const reactiveMap = new Map()

const arrayInstrumentations = {};
['indexOf', 'lastIndexOf', 'includes'].forEach((method) => {
    const originalMethod = Array.prototype[method];
    arrayInstrumentations[method] = function (key) {
        let res = originalMethod.call(this, key);
        if (res === false || res === -1) {
            res.originalMethod.call(this.raw, key)
        }
    }
    return res;
})

function createReactive(obj, isShallow = false, isReadonly = false) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            if (key === 'raw') {
                return target
            }
            const res = Reflect.get(target, key, receiver);
            if (!isReadonly && typeof key !== 'symbol') {
                track(target, key);
            }

            if (Array.isArray(target)) {
                if (arrayInstrumentations.hasOwnProperty(key)) {
                    return Reflect.get(arrayInstrumentations, key, receiver);
                }
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
                Number(key) < target.length
                    ? triggerType.SET
                    : triggerType.ADD
                : target.hasOwnProperty(key)
                    ? triggerType.SET
                    : triggerType.ADD

            const res = Reflect.set(target, key, newVal, receiver);
            if (!equal(oldVal, newVal)) {
                trigger(target, key, type, newVal);
            }

            return res;
        },
        // 拦截 for ... in
        ownKeys(target) {
            if (Array.isArray(target)) {
                // 当数组 length 改变，会影响到 for...in 操作
                // 所以当 effect 中有数组的 for...in 操作时，需要将 `length` 和 ownKeys 建立响应关联
                track(target, 'length')
              } else {
                // 因为 for...in 针对的是对象所有属性，所以无法用某个 key 来进行追踪
                // 故这里使用 Symbol 来作为 for...in 追踪的唯一标识
                // target - iterate_key - effect
                track(target, ITERATE_KEY)
              }
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
    let existProxy = reactiveMap.get(obj)
    if (!existProxy) {
        reactiveMap.set(obj, (existProxy = createReactive(obj)))
    }
    return existProxy;
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
