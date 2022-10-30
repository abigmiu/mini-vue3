import { effect } from './effect';

export function computed(getter) {
    let dirty = true;
    let cache;

    const runner = effect(getter, {
        lazy: true,
        scheduler() {
            dirty = true;
        },
    });

    return {
        get value() {
            if (dirty) {
                cache = runner();
                dirty = false;
            }
            return cache;
        },
    };
}
