import { expect, it } from "vitest";
import { vitest } from "vitest";
import { describe } from "vitest";
import { effect } from "../effect";
import { ref } from "../ref";

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
})
