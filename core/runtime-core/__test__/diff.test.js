import { vitest } from "vitest";
import { expect } from "vitest";
import { describe, it } from "vitest";
import { domRenderer } from '../renderers.js'

describe('diff', () => {
    it('简单 diff', () => {
        const root = document.createElement('div')
        const spyFn = vitest.spyOn(console, 'log')

        const vnode1 = {
            type: 'div',
            children: [
                {
                    type: 'p',
                    children: '1'
                },
                {
                    type: 'p',
                    children: '2'
                },
                {
                    type: 'p',
                    children: '3'
                }
            ]
        }

        const vnode2 = {
            type: 'div',
            children: [
                { type: 'p', children: '4' },
                { type: 'p', children: '5' },
                { type: 'p', children: '6' },
            ]
        }

        const vnode3 = {
            type: 'div',
            children: [
                { type: 'p', children: '4' },
                { type: 'p', children: '5' },
                { type: 'p', children: '6' },
                { type: 'p', children: '7' },
            ]
        }

        const vnode4 = {
            type: 'div',
            children: [
                { type: 'p', children: '4' },
                { type: 'p', children: '5' },
            ]
        }

        domRenderer.render(vnode1, root);
        domRenderer.render(vnode2, root)
        expect(spyFn).toHaveBeenCalledTimes(3)
        domRenderer.render(vnode3, root)
        expect(spyFn).toHaveBeenCalledTimes(7)
        domRenderer.render(vnode4, root);
    })
})
