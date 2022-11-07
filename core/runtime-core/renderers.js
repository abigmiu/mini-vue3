import { createRender } from "./index.js";

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
    }
})
