export const TEXT = Symbol()

export function createRender(options) {
    const { createElement, insert, setElement, patchProps, createText, setText } = options;

    function patchChildren(vnode1, vnode2, container) {
        if (typeof vnode2.children === 'string') {
            if (Array.isArray(vnode1.children)) {
                vnode1.children.forEach(c => unmount(c))
            }
            setElement(container, vnode2.children)
        } else if (Array.isArray(vnode2.children)) {
            if (Array.isArray(vnode1.children)) {
                vnode1.children.forEach(c => unmount(c))
                vnode2.children.forEach(c => patch(null, c, container))
            } else {
                setElement(container, '')
                vnode2.children.forEach(c => patch(null, c, container))
            }
        } else {
            if (Array.isArray(vnode1.children)) {
                vnode1.children.forEach(c => unmount(c))
            }
            setElement(container, '');
        }
    }

    function patchElement(vnode1, vnode2) {
        const el = vnode2.el = vnode1.el;
        const oldProps = vnode1.props
        const newProps = vnode2.props;


        for (const key in newProps) {
            if (newProps[key] !== oldProps[key]) {
                patchProps(el, key, oldProps[key], newProps[key]);
            }
        }

        for (const key in oldProps) {
            if (!(key in newProps)) {
                patchProps(el, key, oldProps[key], null)
            }
        }

        patchChildren(vnode1, vnode2, el);
    }

    function patch(vnode1, vnode2, container) {
        if (vnode1 && vnode1.type !== vnode2.type) {
            unmount(vnode1)
            vnode1 = null
        }
        const { type } = vnode2

        if (typeof type === 'string') {
            if (!vnode1) {
                mountElement(vnode2, container)
            } else {
                patchElement(vnode1, vnode2)
            }
        } else if (type === TEXT) {
            if (!vnode1) {
                const el = vnode2 = createText(vnode2.children)
                insert(el, container)
            } else {
                const el = vnode1.el = vnode2.el
                if (vnode2.children !== vnode1.children) {
                    setText(el, vnode2.children)
                }
            }
        }
        else if (type === 'object') {
            // 组件
        } else { }
    }

    function mountElement(vnode, container) {
        const el = vnode.el = document.createElement(vnode.type);
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

    function unmount(vnode) {
        const el = vnode.el;
        const parent = el.parentNode;
        if (parent) {
            parent.removeChild(el);
        }
    }

    function render(vnode, container) {
        if (vnode) {
            patch(container._vnode, vnode, container)
        } else {
            if (container._vnode) {
                unmount(container._vnode)
            }
        }

        container._vnode = vnode
    }

    function hydrate() { }

    return {
        render,
    }
}
