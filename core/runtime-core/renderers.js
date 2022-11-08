import { createRender } from "./index.js";


function shouldSetAsProps(key, el, nextValue) {
    /**
     * 特殊处理：比如 input.form 是只读的，只能用 setAttribute 函数来设置
     * 此处省略其他情况
     */
    if (key === 'form' && el.tagName === 'INPUT') {
        return false;
    }

    return key in el;
}

function handleEvent(el, key, eventCallback) {
    let invoker = el._vei;
    const name = key.slice(2).toLowerCase()

    if (eventCallback) {
        if (!invoker) {
            invoker = el._vei = (e) => invoker.value(e)
            invoker.value = eventCallback
            el.addEventListener(name, eventCallback)
        } else {
            invoker.value = eventCallback
        }
    } else if (invoker) {
        el.removeEventListener(name, invoker)
    }
}


export const customRenderer = createRender({
    createElement(tag) {
        return { tag }
    },
    setElement(el, children) {
        el.text = children
    },
    insert(el, parent, anchor = null) {
        parent.children = el;
    }
})

export const domRenderer = createRender({
    createElement(type) {
        return document.createElement(type);
    },
    setElement(el, children) {
        el.textContent = children
    },
    insert(el, container) {
        container.appendChild(el)
    },
    patchProps(el, key, preValue, nextValue) {
        // 对 class 进行特殊处理，使用 el.className 设置是性能最高的方式
        if (key === 'class') {
            el.className = nextValue
        } else if (/^on/.test(key)) {
            handleEvent(el, key, nextValue)
        } else if (shouldSetAsProps(key, el, nextValue)) {
            /**
             * HTML Attributes 的作用是设置与之对应的 DOM Properties 的初始值
             * 判断 key 是否存在对应的 DOM Properties
             * -> div 就没有 input 的 form 属性
             */
            /**
             * 获取节点类型
             * typeof button['disabled'] === 'boolean'
             * typeof button['id'] === 'string'
             */
            const type = typeof el[key]
            if (type === 'boolean' && nextValue === '') {
                el[key] = true;
            } else {
                el[key] = nextValue;
            }
        } else {
            el.setAttribute(key, nextValue)
        }
    }
})
