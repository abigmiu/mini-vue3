import { track, trigger, triggerType } from './effect.js';
import { equal, isMap, isSet } from '../util.js'

export let ITERATE_KEY = Symbol()
export let shouldTrack = true
const reactiveMap = new Map()

// 数组处理
const arrayInstrumentations = {};
['indexOf', 'lastIndexOf', 'includes'].forEach((method) => {
    const originalMethod = Array.prototype[method];
    arrayInstrumentations[method] = function (key) {
        let res = originalMethod.call(this, key);
        if (res === false || res === -1) {
            res = originalMethod.call(this.raw, key)
        }
        return res;
    }

});
['push', 'pop', 'shift', 'unshift', 'splice'].forEach(method => {
    const originalMethod = Array.prototype[method]

    arrayInstrumentations[method] = function (...args) {
        shouldTrack = false;
        let res = originalMethod.apply(this.raw, args)
        shouldTrack = true;
        return res;
    }
});

// set处理
const wrap = (val) => typeof val === 'object' ? reactive(val) : val;
const mutableInstrumentations = {
    [Symbol.iterator]() {
        const target = this.raw;
        const iterator = target[Symbol.iterator]()
        track(target, ITERATE_KEY)
        return {
            next() {
                const { value, done } = iterator.next();
                return {
                    done,
                    value: value ? [wrap(value[0]), wrap(value[1])] : value
                }
            }
        }
    },
    forEach(callback, thisArg) {
        const target = this.raw;
        track(target, ITERATE_KEY);
        target.forEach((v, k) => {
            callback.call(thisArg, wrap(v), wrap(k), this)
        })
    },
    get(key) {
        const target = this.raw;
        const res = target.get(key);
        track(target, key);
        if (res) {
            return wrap(res)
        }
    },
    add(key) {
        const target = this.raw;
        const hasKey = target.has(key)
        const res = target.add(key)

        if (!hasKey) {
            trigger(target, ITERATE_KEY, triggerType.ADD)
        }

        return res;
    },
    set(key, value) {
        const target = this.raw;
        const hasKey = target.has(key);
        const oldVal = target.get(key);

        const rawVal = value.raw || value;
        target.set(key, rawVal);

        const type = hasKey ? triggerType.SET : triggerType.ADD
        if (!equal(rawVal, oldVal)) {
            trigger(target, key, type)
        }
    },
    delete(key) {
        const target = this.raw;
        const hasKey = target.has(key);
        const res = target.delete(key);

        if (hasKey) {
            trigger(target, ITERATE_KEY, triggerType.DELETE)
        }

        return res;
    }
}

function createReactive(obj, isShallow = false, isReadonly = false) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            if (key === 'raw') {
                return target
            }



            if (isSet(target) || isMap(target)) {
                if (key === 'size') {
                    track(target, ITERATE_KEY)
                    return Reflect.get(target, key, target)
                }
                return mutableInstrumentations[key]
            }

            if (Array.isArray(target)) {
                if (arrayInstrumentations.hasOwnProperty(key)) {
                    return Reflect.get(arrayInstrumentations, key, receiver);
                }
            }

            if (!isReadonly && typeof key !== 'symbol') {
                track(target, key);
            }

            const res = Reflect.get(target, key, receiver);
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
