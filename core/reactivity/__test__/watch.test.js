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

    it('对象任意属性都可以触发回调', () => {
        const obj = reactive({
            foo: 1,
            bar: 1,
        });
        const cb = vitest.fn(() => null);
        watch(obj, cb);

        expect(cb).toHaveBeenCalledTimes(0);
        obj.foo++;
        expect(cb).toHaveBeenCalledTimes(1);
        obj.bar++;
        expect(cb).toHaveBeenCalledTimes(2);
    });

    it('可以监听 getter函数', function () {
        console.log('监听 getter 函数');
        const obj = reactive({
            foo: 1,
            bar: 1,
        });
        const cb = vitest.fn(() => null);

        const getter = vitest.fn(() => obj.foo);
        watch(getter, cb);
        obj.foo++;
        expect(cb).toHaveBeenCalledTimes(1);
        obj.bar++;
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it('回调函数可以获取新值和旧值', () => {
        const obj = reactive({
            foo: 1,
            bar: 1,
        });
        let _newVal, _oldVal;

        const cb = vitest.fn((newVal, oldVal) => {
            _newVal = newVal;
            _oldVal = oldVal;
        })
        const getter = vitest.fn(() => obj.foo)
        watch(getter, cb)

        obj.foo++;
        expect(_oldVal).toBe(1)
        expect(_newVal).toBe(2)
        obj.foo++;

        expect(_oldVal).toBe(2)
        expect(_newVal).toBe(3)
    })

    it('immediate 立即执行', () => {
        const obj = reactive({
            foo: 1,
            bar: 1,
        });
        const cb = vitest.fn(() => null)
        watch(obj, cb, {
            immediate: true,
        })
        expect(cb).toHaveBeenCalledTimes(1)

    })

    it('onInvalidate 回调处理竞态问题', () => {
        vitest.useFakeTimers()
        let finalData
        let arr = [1, 2, 3]

        async function sleep(ms) {
            const result = arr.pop();
            return new Promise(r => setTimeout(() => {
                r(result)
            }, ms))
        }

        const obj = reactive({
            foo: 1,
            bar: 1,
        })

        watch(obj, async (newVal, oldVal, onInvalidate) => {
            let expired = false
            onInvalidate(() => {
                console.log('onInvalidate')
                expired = true;
            })
            console.log(arr.length)
            const res = await sleep(arr.length * 1000)
            console.log(newVal)

            if (!expired) {
                finalData = res;
                expect(finalData).toBe(1)
            }
        })

        obj.foo++
        obj.foo++
        obj.foo++
        vitest.runAllTimers()
    })
});
