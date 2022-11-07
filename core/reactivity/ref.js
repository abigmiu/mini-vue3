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
        set value(newValue) {
            value = newValue
        }
    }

    Object.defineProperty(wrapper, refFlag, {
        value: true,
    })

    return reactive(wrapper)
}

export function toRef(obj, key) {
    const wrapper = {
        get value() {
            return obj[key]
        },
        set value(newValue) {
            obj[key] = newValue;
        }
    }

    Object.defineProperty(wrapper, refFlag, {
        value: true
    })

    return wrapper
}

export function toRefs(obj) {
    const refs = {}
    for (const k in obj) {
        refs[k] = toRef(obj, k)
    }
    return refs;
}

export function proxyRefs(obj) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            const res = Reflect.get(target, key, receiver);

            return isRef(res) ? res.value : res
        },
        set(target, key, val, receiver) {
            const value = target[key]
            if (isRef(value)) {
                value.value = val;
                return true;
            }
            return Reflect.set(target, key, val, receiver)
        }
    })
}
