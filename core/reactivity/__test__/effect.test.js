import { describe, expect, it, vitest } from 'vitest';
import { reactive, readonly, shallowReactive, shallowReadonly } from '../reactive.js';
import { effect } from '../effect.js';
import { vi } from 'vitest';

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
            for (const k in obj) { }
        })
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)

        obj.bar = 1
        expect(fn).toHaveBeenCalledTimes(2)
    })

    it('对象已有属性修改不触发 for ... in 副作用', () => {
        const obj = reactive({
            foo: 1,
        })

        const fn = vitest.fn(() => {
            for (const k in obj) { }
        })
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        obj.foo++
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('删除对象属性触发 for ... in 副作用', () => {
        const obj = reactive({
            foo: 1,
        })
        const fn = vitest.fn(() => {
            for (const k in obj) { }
        })
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        delete obj.foo
        expect(fn).toHaveBeenCalledTimes(2)
    })
    it('set 值不变时， 不触发副作用函数', () => {
        const obj = reactive({
            foo: 1,
        })
        const fn = vitest.fn(() => obj.foo)
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        obj.foo = 1;
        expect(fn).toHaveBeenCalledTimes(1)
        obj.foo++
        expect(fn).toHaveBeenCalledTimes(2)
    })

    it('浅响应 与深响应', () => {
        const shallowObj = shallowReactive({
            foo: {
                bar: 1
            }
        })
        const obj = reactive({
            foo: {
                bar: 1
            }
        })

        const shallowFn = vitest.fn(() => shallowObj.foo.bar)
        const fn = vitest.fn(() => obj.foo.bar)

        effect(shallowFn)
        effect(fn)

        expect(shallowFn).toHaveBeenCalledTimes(1)
        expect(fn).toBeCalledTimes(1)

        shallowObj.foo.bar++;
        obj.foo.bar++;
        expect(shallowFn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledTimes(2)
    })

    it('readonly', () => {
        let warnMsg
        const spy = vitest.spyOn(console, 'warn')
        spy.mockImplementation(msg => {
            warnMsg = msg
        })
        const obj = readonly({
            foo: {
                bar: 1
            }
        })
        const shallowObj = shallowReadonly({
            foo: {
                bar: 1
            }
        })
        obj.foo.bar++
        expect(obj.foo.bar).toBe(1)
        shallowObj.foo.bar++
        expect(shallowObj.foo.bar).toBe(2)
        expect(spy).toHaveBeenCalledTimes(1)
        expect(warnMsg).toBe('bar is Readonly')
        spy.mockRestore()
    })

    it('arr[index], index >= arr.length 时，触发 length 副作用', () => {
        const arr = reactive([])
        const fn = vitest.fn(() => arr.length)
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)

        arr[0] = 1
        expect(fn).toBeCalledTimes(2)
    })
    it('修改 arr.length，隐式影响数组元素', function () {
        /*  当对象为数组时:
            - key 为索引值
            - arr.length = newIndex
              - 所有 index >= newIndex -> trigger(arr, index)
        * */
        const arr = reactive([1, 2, 3])
        const fn1 = vitest.fn(() => arr[0])
        const fn2 = vitest.fn(() => arr[1])
        const fn3 = vitest.fn(() => arr[2])

        effect(fn1)
        effect(fn2)
        effect(fn3)

        expect(fn1).toHaveBeenCalledTimes(1)
        expect(fn2).toHaveBeenCalledTimes(1)
        expect(fn3).toHaveBeenCalledTimes(1)

        arr.length = 3
        expect(fn1).toHaveBeenCalledTimes(1)
        expect(fn2).toHaveBeenCalledTimes(1)
        expect(fn3).toHaveBeenCalledTimes(1)

        arr.length = 1
        expect(fn1).toHaveBeenCalledTimes(1)
        expect(fn2).toHaveBeenCalledTimes(2)
        expect(fn3).toHaveBeenCalledTimes(2)
    });
    it('for...in', function () {
        const arr = reactive([1, 2, 3])
        const fn = vitest.fn(() => {
            for (const index in arr) { }
        })
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        /**
         * 当 arr.length 改变，会影响到 for...in 操作
         * - 1. 设置元素 arr[index] = 100，index > arr.length 时
         * - 2. 修改 length 属性是，arr.length = 0
         */
        arr[100] = 100
        expect(fn).toHaveBeenCalledTimes(2)
        arr.length = 0
        expect(fn).toHaveBeenCalledTimes(3)
    });

    it('for...of', function () {
        const arr = reactive([1, 2, 3])
        const fn = vitest.fn(() => {
            for (const index of arr) { }
        })
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        /**
         * for...of 和 for...in 类似，不需要增加额外代码
         * 但需要知道 for...of 会读取 [Symbol.iterator] 属性
         * 内建 Symbol 一般是不会修改的，所以 Symbol 不应该被 track
         */
        arr[100] = 100
        expect(fn).toHaveBeenCalledTimes(2)
        arr.length = 0
        expect(fn).toHaveBeenCalledTimes(3)
    });

    it('arr.includes(arr[0])', () => {
        const obj = {}
        const arr = reactive([obj])
        /*
    ==> EMCAScript 数组 includes 的执行流程
      - 1. 让 O 的值为 ？ToObject(this value)
        - this value 指的是代理对象
      - 10. 重复，while（k < len）
        - a. 让 elementK 的值为 ? Get(0, ！ToString((K)))
        - b. 如果 SameValueZero(searchElement, elementK) 是 true，返回 true
        - 将 k 设置为 k + 1
    ==> 可以看出 `includes` 会通过索引来读取数组的值
      - 但是在 10-b 比较这一步：searchElement 和 elementK 并不是同一个值
        - 这是因为 `reactive` 默认将对象递归代理
          - `arr[0]` 是 一个对象
            - `arr[0]` 会创建一个新的代理对象，假设为 **Proxy_a**
            - `includes` 会遍历每个索引创建代理对象，假设为 **Proxy_b_index**
            - **Proxy_a** 和 **Proxy_b_index** 一定是不相等的

    ==> 使用一个 reactiveMap 来存储原始值和代理的映射关系
    * */
        expect(arr.includes(arr[0])).toBe(true)
    })

    it('arr.includes(rawObj)', function () {
        const obj = {}
        const arr = reactive([obj])
        expect(arr.includes(obj)).toBe(true)
    })
    it('arrProxy.indexOf/lastIndexOf(rawObj)', function () {
        const rawObj = {}
        const arrProxy = reactive([rawObj])

        expect(arrProxy.indexOf(rawObj)).toBe(0)
        expect(arrProxy.indexOf(arrProxy[0])).toBe(0)

        expect(arrProxy.lastIndexOf(rawObj)).toBe(0)
        expect(arrProxy.lastIndexOf(arrProxy[0])).toBe(0)
    })

    it('Set.size', () => {
        const setProxy = reactive(new Set([1, 2, 3]))
        const fn = vitest.fn(() => setProxy.size)

        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
    })
    it('Set.delete', () => {
        const setProxy = reactive(new Set([1, 2, 3]))
        const fn = vitest.fn(() => setProxy.size);

        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        setProxy.delete(1)
    })

    it('add 和 delete 方法应当触发 size 副作用', () => {
        const setProxy = reactive(new Set([1, 2, 3]))
        const fn = vitest.fn(() => setProxy.size);

        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)

        setProxy.add(4)
        expect(fn).toHaveBeenCalledTimes(2)
        setProxy.delete(1)
        expect(fn).toHaveBeenCalledTimes(3)
    })

    it('Map 避免数组污染', () => {
        const m = new Map()
        const p1 = reactive(m)
        const p2 = reactive(new Map())
        p1.set('p2', p2)
        const fn = vitest.fn(() => m.get('p2').size)

        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)

        m.get('p2').set('foo', 1)
        expect(fn).toHaveBeenCalledTimes(1)
    })

    it('Map forEach', () => {
        const p = reactive(new Map().set(1, 1))
        const fn = vitest.fn(() => {
            p.forEach(i => i)
        })
    })
});
