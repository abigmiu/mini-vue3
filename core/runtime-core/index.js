export const TEXT = Symbol()
export const COMMENT = Symbol()
export const Fragment = Symbol()

export function createRender(options) {
    const {
        createElement,
        insert,
        setElement,
        patchProps,
        createText,
        setText,
        createComment,
        setComment,
    } = options;

    // 简单 diff
    function simpleDiff(n1, n2, container) {
        const oldChildren = n1.children;
        const newChildren = n2.children;

        const keysToRemove = new Map();
        oldChildren.forEach(c => keysToRemove.set(c.key, c))

        let lastIndex = 0;
        for (let i = 0; i < newChildren.length; i++) {
            let find = false;
            const newVNode = newChildren[i];
            for (let j = 0; j < oldChildren.length; j++) {
                const oldVNode = oldChildren[j];

                if (oldVNode.key === newVNode.key) {
                    find = true;
                    keysToRemove.delete(oldVNode, key);
                    patch(oldVNode, newVNode, container);

                    if (j < lastIndex) {
                        const preVNode = newChildren[i - 1];
                        if (preVNode) {
                            const anchor = preVNode.el.nextSibling;
                            insert(oldVNode.el, container, anchor);
                        }
                    }
                } else {
                    lastIndex = j;
                }

                break
            }

            if (!find) {
                const preVNode = newChildren[i - 1];
                let anchor = null
                if (preVNode) {
                    anchor = preVNode.el.nextSibling;
                } else {
                    anchor = container.firstChild
                }
                patch(null, newVNode, container, anchor)
            }
        }

        keysToRemove.forEach((vnode, key) => {
            unmount(vnode)
        })
    }

    // 双端 diff
    function doubleEndDiff(vnode1, vnode2, container) {
        const oldChildren = vnode1.children;
        const newChildren = vnode2.children;

        let oldStartIdx = 0
        let oldEndIdx = vnode1.children.length.length - 1
        let newStartIdx = 0
        let newEndIdx = vnode2.children.length - 1

        let oldStartVNode = oldChildren[oldStartIdx]
        let newStartVNode = newChildren[newStartIdx]
        let oldEndVNode = oldChildren[oldEndIdx]
        let newEndVNode = newChildren[newEndIdx]

        while (newStartIdx <= newEndIdx && oldStartIdx <= oldEndIdx) {
            if (!oldStartVNode) {
                oldStartVNode = oldChildren[++oldStartIdx]
            } else if (!oldEndVNode) {
                oldEndVNode = oldChildren[--oldEndIdx]
            } else if (newStartVNode.key === oldStartVNode.key) {
                patch(oldStartVNode, newStartVNode, container)
                oldStartVNode = oldChildren[++oldEndIdx]
                newStartVNode = newChildren[++newStartIdx]
            } else if (newEndVNode.key === oldEndIdx.key) {
                patch(oldEndVNode, newEndVNode, container)
                oldEndVNode = oldChildren[--oldEndIdx]
                newEndVNode = newChildren[--newEndIdx]
            } else if (newEndVNode.key === oldStartVNode.key) {
                patch(oldStartVNode, newEndVNode, container)
                insert(oldStartVNode.el, container, oldEndVNode.el.nextSibling);
                newEndVNode = newChildren[--newEndIdx]
                oldStartVNode = oldChildren[++oldStartIdx]
            } else if (newStartVNode.key === oldEndVNode.key) {
                patch(oldEndVNode, newStartVNode, container)
                insert(oldEndVNode.el, container, oldStartVNode.el)
                oldEndVNode = oldChildren[--oldEndIdx]
                newStartVNode = newChildren[++newStartIdx]
            } else {
                const idxInOld = oldChildren.findIndex(v => v.key === newStartVNode.key)

                if (idxInOld > 0) {
                    const nodeToMove = oldChildren[idxInOld];
                    patch(nodeToMove, newStartVNode, container)
                    insert(nodeToMove.el, container, oldStartVNode.el)

                    oldChildren[idxInOld] = null
                    newStartVNode = newChildren[++newStartIdx]
                } else {
                    patch(null, newStartVNode, container)
                }
                newStartVNode = newChildren[++newStartIdx]
            }
        }

        if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
            for (let i = newStartIdx; i <= newEndIdx; i++) {
                patch(null, newChildren[i], container, oldStartVNode[i])
            }
        }

    }

    function patchChildren(vnode1, vnode2, container) {
        if (typeof vnode2.children === 'string') {
            if (Array.isArray(vnode1.children)) {
                vnode1.children.forEach(c => unmount(c))
            }
            setElement(container, vnode2.children)
        } else if (Array.isArray(vnode2.children)) {
            if (Array.isArray(vnode1.children)) {
                // diff
              doubleEndDiff(vnode1, vnode2, container)
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
        }
        else if (type === TEXT) {
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
        else if (type === COMMENT) {
            if (!vnode1) {
                const el = vnode2.el = createComment(vnode2.children)
                insert(el, container)
            } else {
                const el = vnode1.el = vnode2.el
                if (vnode2.children !== vnode1.children) {
                    setComment(el, vnode2.children);
                }
            }
        }
        else if (type === Fragment) {
            if (!vnode1) {
                vnode2.children.forEach(c => patch(null, c, container))
            } else {
                patchChildren(vnode1, vnode2, container)
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
