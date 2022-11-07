import { expect } from "vitest";
import { describe, it } from "vitest";
import { createRender } from "../index.js";

describe('renderer', function () {
    it('renderer', function () {
        const renderer = createRender({
            createElement(tag) {
                return { tag }
            },
            setElement(el, children) {
                el.text = children
            },
            insert(el, parent, anchor = null) {
                parent.children = el
            }
        })
        const root = document.createElement('div')
        const vnode = {
            type: 'h1',
            children: 'hello world'
        }
        renderer.render(vnode, root)

        expect(root.innerHTML).toBe('<h1>hello world</h1>')
    })

})
