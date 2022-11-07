export function patch(vnode1, vnode2, container) {
    if (!vnode1) {
        mountElement(vnode2, container)
    } else {

    }
}

function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    if (typeof vnode.children === 'string') {
        el.textContent = vnode.children
    }
    container.appendChild(el);
}

export function createRender() {
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
