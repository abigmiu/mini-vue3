import { reactive } from "./reactive";

const refFlag = '_v_isRef'

export function isRef(value) {
    return !!value[refFlag]
}

export function ref(value) {
    const wrapper = {
        get value() {
            return value
        },
        set value(val) {
            value = val
        }
    }

    Object.defineProperty(wrapper, refFlag, {
        value: true,
    })

    return reactive(wrapper)
}
