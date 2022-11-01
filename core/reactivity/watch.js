import { effect } from './effect';

export function watch(source, callback) {
    effect(() => source.foo, {
        scheduler() {
            callback();
        },
    });
}
