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
        /**
         * HTML Attributes 的作用是设置与之对应的 DOM Properties 的初始值
         * 判断 key 是否存在对应的 DOM Properties
         * -> div 就没有 input 的 form 属性
         */
        if (shouldSetAsProps(key, el, nextValue)) {
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
