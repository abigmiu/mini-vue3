import { describe, expect, it, vitest } from 'vitest';
import { reactive } from '../reactive.js';
import { effect } from '../effect.js';

describe('effect', () => {
    it('should observe basic properties', () => {
        let dummy;
        const counter = reactive({
            num: 0,
        });
        effect(() => (dummy = counter.num + 1));

        expect(dummy).toBe(1);
        counter.num = 7;
        expect(dummy).toBe(8);
    });

    it('分支切换 -》清除遗留副作用函数', function () {
        let text;
        const obj = reactive({
            ok: true,
            text: 'hello',
        });

        const fn = vitest.fn(() => {
            text = obj.ok ? obj.text : 'sorry';
        });
        effect(fn);
        expect(fn).toHaveBeenCalledTimes(1);

        expect(text).toBe('hello');
        obj.ok = false;
        expect(fn).toHaveBeenCalledTimes(2);
        expect(text).toBe('sorry');

        obj.text = 'change';
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('嵌套 Effect', function () {
        let obj = reactive({
            foo: 'foo',
            bar: 'bar',
        });

        const fn1 = vitest.fn(() => console.log('fn1'));
        const fn2 = vitest.fn(() => console.log('fn2'));

        effect(() => {
            fn1();
            effect(() => {
                fn2();
                obj.foo;
            });
            obj.bar;
        });
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);

        // bj.foo 在内层 effect，obj.foo 改变时不应该触发外层 effect
        obj.foo = 1;
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(2);

        // obj.bar 在外层，因为内层还嵌套了一个 effect()，所以会同时触发内层的 effect
        // => fn1 和 fn2 都会被调用
        obj.bar = 1;
        expect(fn1).toHaveBeenCalledTimes(2);
        expect(fn2).toHaveBeenCalledTimes(3);
    });

    it('避免无限递归循环', function () {
        const obj = reactive({ foo: 1 });
        effect(() => {
            // 同时 get + set -> 在运行当前 effect 未结束时，又调用了当前 effect
            obj.foo++;
        });
    });
});

describe('scheduler', () => {
    it('使用 scheduler 控制调度时机', function () {
        vitest.useFakeTimers();
        const obj = reactive({ foo: 1 });
        let bar;

        effect(
            () => {
                bar = obj.foo;
            },
            {
                scheduler(fn) {
                    setTimeout(fn);
                },
            }
        );
        obj.foo = 0;

        bar = 3;
        vitest.runAllTimers();
        expect(bar).toBe(0);
    });

    it('联系多次修改响应式数据， 只触发一次更新', async function () {
        const p = Promise.resolve();
        const jobQueue = new Set();

        let isFlushing = false;
        function flushJob() {
            if (isFlushing) return;

            isFlushing = true;

            p.then(() => {
                jobQueue.forEach((job) => job());
            }).finally(() => {
                isFlushing = false;
            });
        }

        const obj = reactive({
            foo: 1,
        });
        const fn = vitest.fn(() => console.log(obj.foo));
        effect(fn, {
            scheduler(fn) {
                jobQueue.add(fn);
                flushJob();
            },
        });

        obj.foo++;
        obj.foo++;
        obj.foo++;
        obj.foo++;

        await Promise.resolve;

        expect(fn).toHaveBeenCalledTimes(2);
        expect(obj.foo).toBe(5);
    });

    it('监听 key in obj', () => {
        const obj = reactive({
            foo: 1,
        })

        const fn = vitest.fn(() => {
            'foo' in obj
        })
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)

        obj.foo++;
        expect(fn).toHaveBeenCalledTimes(2)
    })

    it('监听 for ... in', () => {
        const obj = reactive({
            foo: 'foo in',
        })

        const fn = vitest.fn(() => {
            for (const k in obj) {}
        })
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)

        obj.bar = 1
        expect(fn).toHaveBeenCalledTimes(2)
    })
});
