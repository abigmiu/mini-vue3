
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
        /**
         * const a = document.createElement('button')
         * a['disabled'] = true
         * >> a
         * >> <button disabled></button>
         *
         * a['disabled'] = false
         * >> a
         * >> <button></button>
         *
         * typeof a['disabled']
         * >> 'boolean'
         */
        const root1 = document.createElement('div')
        const root2 = document.createElement('div')
        const root3 = document.createElement('div')

        const button1 = {
            type: 'button',
            props: {
                disabled: false,
            }
        }
        domRenderer.render(button1, root1);
        expect(root1.innerHTML).toBe('<button></button>')

        const button2 = {
            type: 'button',
            props: {
                disabled: true,
            }
        }
        domRenderer.render(button2, root2)
        expect(root2.innerHTML).toBe('<button disabled=\"\"></button>')

        const button3 = {
            type: 'button',
            props: {
                disabled: ''
            }
        }
        domRenderer.render(button3, root3)
        expect(root3.innerHTML).toBe('<button disabled=\"\"></button>')
    });

    it('只读属性应当被正确渲染', () => {
        const root = document.createElement('div')

        const vnode = {
            type: 'div',
            children: [
                {
                    type: 'form',
                    props: {
                        id: 'form1'
                    },
                    children: [],
                },
                {
                    type: 'input',
                    props: {
                        form: 'form1',
                    },
                    children: [],
                }
            ]
        }

        domRenderer.render(vnode, root)
        expect(root.innerHTML).toBe('<div><form id="form1"></form><input form="form1"></div>')
    })

    it('设置 html 的 class', () => {
        /**
         * Vue.js 中有三种方式设置 class
         * - 设置字符串
         * - 设置对象
         * - 设置数组
         * 但本质上都可以转化为 “设置字符串” 这一种
         *
         * class 对应的 DOM Properties 是 el.className -> 'class' in el -> false
         * 浏览器有三种方式设置 class
         * - el.className -> 性能最高
         * - el.setAttribute
         * - el.classList
         */
        const root = document.createElement('div');
        const vnode = {
            type: 'div',
            props: {
                class: 'foo bar baz'
            }
        }
        domRenderer.render(vnode, root)
        expect(root.innerHTML).toBe('<div class="foo bar baz"></div>')
    })

    it('unmount', () => {
        const root = document.createElement('div')
        const vnode = {
            type: 'div',
            props: {
                class: 'foo bar baz'
            }
        }
        domRenderer.render(vnode, root)
        expect(root.innerHTML).toBe('<div class="foo bar baz"></div>')
        domRenderer.render(null, root);
        expect(root.innerHTML).toBe('')
    })

    it('事件绑定', () => {
        const root = document.createElement('div')
        const event = () => alert('click')
        const vnode = {
            type: 'button',
            props: {
                id: 'foo',
                onClick: event,
            }
        }
        domRenderer.render(vnode, root)
        console.dir(root)
    })
})
