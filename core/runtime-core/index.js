export function createRender(options) {
    const { createElement, insert, setElement } = options;

    function patch(vnode1, vnode2, container) {
        if (!vnode1) {
            mountElement(vnode2, container)
        } else {

        }
    }

    function mountElement(vnode, container) {
        const el = document.createElement(vnode.type);
        if (typeof vnode.children === 'string') {
            setElement(el, vnode.children)
        } else if (Array.isArray(vnode.children)) {
            vnode.children.forEach((child) => {
                patch(null, child, el)
            })
        }

        if (vnode.props) {
            for (const key in vnode.props) {
                el.setAttribute(key, vnode.props[key])
                /**
                 * HTML Attributes 的作用是设置与之对应的 DOM Properties 的初始值
                 * 判断 key 是否存在对应的 DOM Properties
                 * -> div 就没有 input 的 form 属性
                 */
                if (key in el) {
                    /**
                     * 获取节点类型
                     * typeof button['disabled'] === 'boolean'
                     * typeof button['id'] === 'string'
                     */
                    const type = typeof el[key]
                    const value = vnode.props[key]

                    if (type === 'boolean' && value === '') {
                        el[key] = true;
                    } else {
                        el[key] = value
                    }
                } else {
                    el.setAttribute(key, vnode.props[key]);
                }
            }
        }

        insert(el, container)
    }

    function render(vnode, container) {
        if (vnode) {
            patch(container._vnode, vnode, container)
        } else {
            if (container._vnode) {
                container.innerHTML = ''
            }
        }

        container._vnode = vnode
    }

    function hydrate() { }

    return {
        render,
    }
}
