import { track, trigger } from './effect.js';

function createReactive(obj) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            const res = Reflect.get(target, key, receiver);
            track(target, key);
            return res;
        },
        has (target, key, receiver) {
            const res = Reflect.has(target, key, receiver);
            track(target, key);
            return res;
        },
        set(target, key, value, receiver) {
            const res = Reflect.set(target, key, value, receiver);
            trigger(target, key);
            return res;
        }

    });
}

export function reactive(obj) {
    return createReactive(obj);
}
