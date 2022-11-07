
import { expect, describe, it } from 'vitest';
import { customRenderer, domRenderer } from '../renderers.js'

describe('render', () => {
    it('customerRenderer', () => {
        const root = {
            tag: 'div'
        }

        const vnode = {
            type: 'h1',
            children: 'hello'
        }
        customRenderer.render(vnode, root);
        console.log(root.children)
    })

    it('domRenderer', () => {
        const root = document.createElement('div')
        const vnode = {
            type: 'h1',
            children: 'hello'
        }
        domRenderer.render(vnode, root)
        expect(root.innerHTML).toBe('<h1>hello</h1>')
    })

    it('should render nested vnode', () => {
        const root = document.createElement('div')
        const vnode = {
            type: 'h1',
            children: [
                {
                    type: 'p',
                    children: 'hello'
                }
            ]
        }
        domRenderer.render(vnode, root)
        expect(root.innerHTML).toBe('<h1><p>hello</p></h1>')
    })

    it('should render props', () => {
        const root = document.createElement('div')
        const vnode = {
            type: 'div',
            props: {
                id: 'foo',
            },
            children: [
                {
                    type: 'p',
                    children: 'hello'
                }
            ]
        }

        domRenderer.render(vnode, root);
        expect(root.innerHTML).toBe('<div id="foo"><p>hello</p></div>')
    })
    it('button disabled should be set correctly', function () {
        const root = document.createElement('div')
        const button = {
            type: 'button',
            props: {
                disabled: false
            }
        }

        domRenderer.render(button, root)
    });
})
