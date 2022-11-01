import { it } from 'vitest';
import { vitest } from 'vitest';
import { expect } from 'vitest';
import { describe } from 'vitest';
import { reactive } from '../reactive';
import { watch } from '../watch';

describe('watch', function () {
    it('监听响应式对象并触发回调', function () {
        const obj = reactive({
            foo: 1,
        });

        const cb = vitest.fn(() => obj.foo);
        watch(obj, cb);

        expect(cb).toHaveBeenCalledTimes(0);
        obj.foo++;
        expect(cb).toHaveBeenCalledTimes(1);
    });
});
