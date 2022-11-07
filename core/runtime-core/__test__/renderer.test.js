import { expect } from "vitest";
import { describe, it } from "vitest";
import { createRender } from "../index.js";
const renderer = createRender()
const root = document.createElement('div')
describe('renderer', function () {
    it('renderer', function () {
        const vnode = {
            type: 'h1',
            children: 'hello world'
        }
        renderer.render(vnode, root)

        expect(root.innerHTML).toBe('<h1>hello world</h1>')
    })
})
