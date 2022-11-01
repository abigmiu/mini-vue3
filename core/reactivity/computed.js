import { effect, track, trigger } from './effect.js';

export function computed(getter) {
    let dirty = true;
    let cache;

    const runner = effect(getter, {
        lazy: true,
        scheduler() {
            dirty = true;
            trigger(obj, 'value');
        },
    });

    const obj = {
        get value() {
            if (dirty) {
                cache = runner();
                track(obj, 'value');
                dirty = false;
            }
            return cache;
        },
    };

    return obj;
}
