export function createRender(options) {
    const { createElement, insert, setElement, patchProps } = options;

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
                patchProps(el, key, null, vnode.props[key])
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
