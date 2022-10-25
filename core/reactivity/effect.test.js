import { describe, expect, it, vitest } from 'vitest';
import { reactive } from './reactive.js';
import { effect } from './effect.js';

describe('effect', () => {
    it('should observe basic properties', () => {
        let dummy;
        const counter = reactive({
            num: 0,
        });
        effect(() => dummy = counter.num + 1);

        expect(dummy).toBe(1);
        counter.num = 7;
        expect(dummy).toBe(8);
    });

    it('分支切换 -》清除遗留副作用函数', function () {
        let text;
        const obj = reactive({
            ok: true,
            text: 'hello'
        })

        const fn = vitest.fn(() => {
            text = obj.ok ? obj.text : 'sorry'
        })
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)

        expect(text).toBe('hello')
        obj.ok = false
        expect(fn).toHaveBeenCalledTimes(2)
        expect(text).toBe('sorry')

        obj.text = 'change'
        expect(fn).toHaveBeenCalledTimes(2)
    })
});