import { expect, it } from "vitest";
import { vitest } from "vitest";
import { describe } from "vitest";
import { effect } from "../effect";
import { reactive } from "../reactive";
import { isRef, proxyRefs, ref, toRef, toRefs } from "../ref";

describe('ref', function () {
    it('ref.value', () => {
        const r = ref(1)
        expect(r.value).toBe(1)
    })

    it('ref.value 触发 effect', () => {
        const r = ref(1)
        const fn = vitest.fn(() => r.value)
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        r.value++
        expect(fn).toHaveBeenCalledTimes(2)
    })

    it('isRef', () => {
        const a = ref('a')
        const b = reactive({
            b: 'b'
        })
        const c = 'c'
        expect(isRef(a)).toBe(true)
        expect(isRef(b)).toBe(false)
        expect(isRef(c)).toBe(false)
    })

    it('toRef', () => {
        const obj = reactive({
            a: 'a',
            b: 'b',
        })

        const newObj = {
            a: toRef(obj, 'a'),
            b: toRef(obj, 'b')
        }

        const fn = vitest.fn(() => newObj.a.value)
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        newObj.a.value++
        expect(fn).toHaveBeenCalledTimes(2)
    })

    it('toRefs', () => {
        const obj = reactive({
            a: 'a',
            b: 'b'
        })
        const newObj = toRefs(obj)
        const fn = vitest.fn(() => newObj.a.value)

        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        newObj.a.value++;
        expect(fn).toHaveBeenCalledTimes(2)
    })

    it('proxyRefs', () => {
        const obj = reactive({
            a: 1,
            b: 2
        })

        const newObj = proxyRefs({...toRefs(obj)})
        const fn = vitest.fn(() => newObj.a)

        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)

        expect(newObj.a).toBe(1)
        newObj.a++
        expect(newObj.a).toBe(2)
        expect(fn).toHaveBeenCalledTimes(2)
    })

})
