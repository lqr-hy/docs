# Update

### 1、将虚拟 VNode 渲染成真实的 DOM

1. 保存当前的 `VNode`：

   - `const prevVnode = vm._vnode` 保存当前的 `VNode`，以便后续进行比较和更新。

2. 设置当前活动实例：

   - `const restoreActiveInstance = setActiveInstance(vm)` 设置当前活动的 Vue 实例。

3. 首次渲染：

   - 如果 `prevVnode` 为空，表示这是组件的首次渲染。调用 `vm.__patch__` 方法将新的 `VNode` 转换为真实的 `DOM`，并挂载到根元素上。

4. 更新渲染：

   - 如果 `prevVnode` 不为空，表示这是组件的更新渲染。调用 `vm.__patch__` 方法对比新旧 `VNode`，并进行必要的 `DOM` 更新。

5. 恢复活动实例：

   - `restoreActiveInstance()` 恢复之前的活动实例。

6. 更新 `DOM` 引用：

   - 更新 `__vue__` 引用，以便在真实 DOM 上引用 Vue 实例。

7. 更新父组件的 `$el`：

   - 如果当前组件是高阶组件 (HOC)，更新其父组件的 `$el`。

8. 调用 `updated` 钩子：

   - 在渲染和更新完成后，调用 `updated` 钩子函数。

```ts
Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
  const vm: Component = this
  const prevEl = vm.$el
  const prevVnode = vm._vnode
  const restoreActiveInstance = setActiveInstance(vm) // 设置活动实例
  vm._vnode = vnode // 设置vnode
  // Vue.prototype.__patch__是在入口点中注入的
  // 根据使用的渲染后端。
  if (!prevVnode) {
    // 初始渲染
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
  } else {
    // 更新
    vm.$el = vm.__patch__(prevVnode, vnode)
  }
  restoreActiveInstance() // 恢复活动实例
  // 更新__vue__引用
  if (prevEl) {
    prevEl.__vue__ = null
  }
  if (vm.$el) {
    // 如果有挂载元素
    vm.$el.__vue__ = vm
  }
  // 如果父组件是高阶组件，也更新它的$el
  let wrapper: Component | undefined = vm
  while (
    wrapper &&
    wrapper.$vnode &&
    wrapper.$parent &&
    wrapper.$vnode === wrapper.$parent._vnode
  ) {
    wrapper.$parent.$el = wrapper.$el
    wrapper = wrapper.$parent
  }
  // 更新钩子由调度程序调用，以确保子代是在父级的更新钩子中更新的。
}
```

### 2、核心调用 `__patch__` 方法

```ts
Vue.prototype.__patch__ = inBrowser ? patch : noop

const patch: Function = createPatchFunction({ nodeOps, modules }) // 创建patch函数 传入nodeOps和modules
```

`createPatchFunction` 方法 传入 `nodeOps` 和 `modules`, `nodeOps` 封装了一系列 DOM 操作方法 `modules` 定义了一些模块的钩子函数的实现

### 3、 patch 函数

1. 检查新 VNode 是否存在：

   - 如果 vnode 不存在，但 oldVnode 存在，则调用 invokeDestroyHook 销毁旧节点，并返回。

2. 初始化变量：

   - isInitialPatch：标记是否是初始修补。
   - insertedVnodeQueue：用于存储插入的 VNode 队列。

3. 处理初始挂载：

   - 如果 oldVnode 不存在，表示这是一个空挂载（可能是组件），创建新的根元素，并将 isInitialPatch 置为 true。

4. 处理更新：

   - 如果 oldVnode 存在，首先检查它是否是真实的 DOM 元素。
   - 如果 oldVnode 和 vnode 是相同的 VNode，则调用 patchVnode 进行更新。
   - 如果 oldVnode 是真实元素，检查是否是服务器渲染内容，并尝试进行水合（hydration）。
   - 如果合成失败或不是服务器渲染内容，创建一个空节点并替换旧节点。

5. 替换现有元素：

   - 获取 oldVnode 的 DOM 元素和父节点。
   - 创建新的节点并插入到父节点中。
   - 递归更新父占位符节点元素。

6. 销毁旧节点：

   - 如果父节点存在，调用 removeVnodes 移除旧节点。
   - 如果 oldVnode 有标签，调用 invokeDestroyHook 销毁旧节点。

7. 调用插入钩子：

   - 在新节点插入后，调用 invokeInsertHook 执行插入钩子。

8. 返回新节点的 DOM 元素：

   - 最后，返回新节点的 DOM 元素。

```ts
patch(oldVnode, vnode, hydrating, removeOnly) {
  if (isUndef(vnode)) { // 如果vnode不存在
    if (isDef(oldVnode)) invokeDestroyHook(oldVnode) // 如果oldVnode存在，调用destroy钩子
    return
  }

  let isInitialPatch = false // 是否是初始修补
  const insertedVnodeQueue: any[] = [] // 插入的vnode队列

  if (isUndef(oldVnode)) { // 如果oldVnode不存在
    // 空挂载（可能作为组件），创建新的根元素
    isInitialPatch = true // 将isInitialPatch置为true
    createElm(vnode, insertedVnodeQueue) // 创建一个元素
  } else {
    const isRealElement = isDef(oldVnode.nodeType) // 如果oldVnode.nodeType存在
    if (!isRealElement && sameVnode(oldVnode, vnode)) { // 如果oldVnode不是真实元素并且oldVnode和vnode相同
      // 修补vnode
      patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly) // 修补vnode
    } else {
      if (isRealElement) { // 如果oldVnode是真实元素
        // 挂载到一个真实元素
        // 检查这是否是服务器渲染的内容以及我们是否可以执行
        // 一个成功的合成作用。
        if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) { // 如果oldVnode.nodeType为1并且oldVnode有SSR_ATTR属性
          oldVnode.removeAttribute(SSR_ATTR)
          hydrating = true
        }
        if (isTrue(hydrating)) {
          if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
            invokeInsertHook(vnode, insertedVnodeQueue, true)
            return oldVnode
          } else if (__DEV__) {
            warn(
              'The client-side rendered virtual DOM tree is not matching ' +
                'server-rendered content. This is likely caused by incorrect ' +
                'HTML markup, for example nesting block-level elements inside ' +
                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                'full client-side render.'
            )
          }
        }
        // 创建一个空节点并替换它
        oldVnode = emptyNodeAt(oldVnode) // 创建一个空节点并替换它
      }

      // 替换现有元素
      const oldElm = oldVnode.elm // 获取oldVnode.elm
      const parentElm = nodeOps.parentNode(oldElm) // 获取oldElm的父节点

      // 创建新节点
      createElm( // 创建一个元素
        vnode,
        insertedVnodeQueue,
        // 极罕见的边缘情况：如果旧元素处于离开转换中，则不要插入。仅在组合转换时发生+ keep-alive + HOCs
        oldElm._leaveCb ? null : parentElm,
        nodeOps.nextSibling(oldElm)
      )

      // 递归更新父占位符节点元素
      if (isDef(vnode.parent)) {
        let ancestor = vnode.parent // 获取vnode.parent
        const patchable = isPatchable(vnode) // 如果vnode是可修补的
        while (ancestor) { // 遍历祖先
          for (let i = 0; i < cbs.destroy.length; ++i) { // 遍历cbs.destroy
            cbs.destroy[i](ancestor)
          }
          ancestor.elm = vnode.elm // 将ancestor.elm设置为vnode.elm
          if (patchable) {
            for (let i = 0; i < cbs.create.length; ++i) { // 遍历cbs.create
              cbs.create[i](emptyNode, ancestor)
            }
            // 调用可能已被create钩子合并的插入钩子。
            // 例如，对于使用“inserted”钩子的指令。
            const insert = ancestor.data.hook.insert
            if (insert.merged) {
              // 从索引1开始，以避免重新调用组件挂载钩子
              // 克隆插入钩子以避免在迭代过程中被改变。
              // 例如，在过渡组下的自定义指令。
              const cloned = insert.fns.slice(1)
              for (let i = 0; i < cloned.length; i++) {
                cloned[i]()
              }
            }
          } else {
            registerRef(ancestor)
          }
          ancestor = ancestor.parent
        }
      }

      // 销毁旧节点
      if (isDef(parentElm)) {
        removeVnodes([oldVnode], 0, 0)
      } else if (isDef(oldVnode.tag)) { // 如果oldVnode.tag存在
        invokeDestroyHook(oldVnode) // 调用destroy钩子
      }
    }
  }

  invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch) // 调用insert钩子
  return vnode.elm
}
```

### 4、patch 过程

```ts
function patchVnode(oldVnode, vnode, insertedVnodeQueue, ownerArray, index, removeOnly?: any) {
  if (oldVnode === vnode) {
    // 如果oldVnode和vnode相同
    return
  }

  if (isDef(vnode.elm) && isDef(ownerArray)) {
    // 如果vnode.elm存在并且ownerArray存在
    // clone reused vnode
    vnode = ownerArray[index] = cloneVNode(vnode) // 克隆vnode
  }

  const elm = (vnode.elm = oldVnode.elm) // 将vnode.elm设置为oldVnode.elm

  if (isTrue(oldVnode.isAsyncPlaceholder)) {
    // 如果oldVnode.isAsyncPlaceholder为true
    if (isDef(vnode.asyncFactory.resolved)) {
      // 如果vnode.asyncFactory.resolved存在
      hydrate(oldVnode.elm, vnode, insertedVnodeQueue)
    } else {
      vnode.isAsyncPlaceholder = true
    }
    return
  }

  // 为静态树重用元素。注意，我们只在vnode被克隆时才这样做 如果新节点没有被克隆，这意味着渲染函数已经通过热重载API重置，我们需要进行适当的重新渲染。
  if (
    isTrue(vnode.isStatic) &&
    isTrue(oldVnode.isStatic) &&
    vnode.key === oldVnode.key &&
    (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
  ) {
    vnode.componentInstance = oldVnode.componentInstance
    return
  }

  let i
  const data = vnode.data
  if (isDef(data) && isDef((i = data.hook)) && isDef((i = i.prepatch))) {
    // 如果data存在并且data.hook存在并且data.hook.prepatch存在
    i(oldVnode, vnode)
  }

  const oldCh = oldVnode.children // 获取oldVnode的children
  const ch = vnode.children // 获取vnode的children
  if (isDef(data) && isPatchable(vnode)) {
    // 如果data存在并且是可修补的
    for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode) // 遍历cbs.update，调用每一个
    if (isDef((i = data.hook)) && isDef((i = i.update))) i(oldVnode, vnode) // 如果data.hook存在并且data.hook.update存在，调用data.hook.update
  }
  if (isUndef(vnode.text)) {
    // 如果vnode.text不存在
    if (isDef(oldCh) && isDef(ch)) {
      // 如果oldCh存在并且ch存在
      if (oldCh !== ch)
        // 如果oldCh和ch不相同
        updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly) // 更新子节点
    } else if (isDef(ch)) {
      // 如果ch存在
      if (__DEV__) {
        checkDuplicateKeys(ch)
      }
      if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, '') // 如果oldVnode.text存在，将elm的文本内容置为空
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue) // 添加子节点
    } else if (isDef(oldCh)) {
      // 如果oldCh存在
      removeVnodes(oldCh, 0, oldCh.length - 1) // 删除子节点
    } else if (isDef(oldVnode.text)) {
      // 如果oldVnode.text存在
      nodeOps.setTextContent(elm, '') // 如果oldVnode.text存在，将elm的文本内容置为空
    }
  } else if (oldVnode.text !== vnode.text) {
    // 如果oldVnode.text和vnode.text不相同
    nodeOps.setTextContent(elm, vnode.text) // 将elm的文本内容设置为vnode.text
  }
  if (isDef(data)) {
    // 如果data存在
    if (isDef((i = data.hook)) && isDef((i = i.postpatch))) i(oldVnode, vnode) // 如果data.hook存在并且data.hook.postpatch存在，调用data.hook.postpatch
  }
}
```

### 5、Diff 过程

1. 初始化索引和边界：

   - oldStartIdx 和 newStartIdx 分别指向旧子节点和新子节点的开始位置。
   - oldEndIdx 和 newEndIdx 分别指向旧子节点和新子节点的结束位置。

2. 遍历旧子节点和新子节点：

   - 使用 while 循环遍历旧子节点和新子节点，直到所有节点都被处理。

3. 比较节点：

   - 比较 oldStartVnode 和 newStartVnode，如果它们是相同的节点，则调用 patchVnode 更新节点，并移动索引。
   - 比较 oldEndVnode 和 newEndVnode，如果它们是相同的节点，则调用 patchVnode 更新节点，并移动索引。
   - 比较 oldStartVnode 和 newEndVnode，如果它们是相同的节点，则调用 patchVnode 更新节点，并移动索引，同时调整节点位置。
   - 比较 oldEndVnode 和 newStartVnode，如果它们是相同的节点，则调用 patchVnode 更新节点，并移动索引，同时调整节点位置。

4. 处理剩余节点：

   - 如果 oldStartIdx 超过 oldEndIdx，则说明新节点中有剩余节点需要添加到 DOM 中。
   - 如果 newStartIdx 超过 newEndIdx，则说明旧节点中有剩余节点需要从 DOM 中移除。

5. 调用辅助函数：

   - patchVnode：用于更新节点的属性和子节点。
   - createElm：用于创建新的 DOM 节点。
   - removeNode：用于移除 DOM 节点。

```ts
function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
  let oldStartIdx = 0
  let newStartIdx = 0
  let oldEndIdx = oldCh.length - 1
  let oldStartVnode = oldCh[0]
  let oldEndVnode = oldCh[oldEndIdx]
  let newEndIdx = newCh.length - 1
  let newStartVnode = newCh[0]
  let newEndVnode = newCh[newEndIdx]
  let oldKeyToIdx, idxInOld, vnodeToMove, refElm

  // removeOnly是一个特殊标志，仅由<transition-group>使用
  // 以确保删除的元素保持正确的相对位置在离开转换期间
  const canMove = !removeOnly // 如果removeOnly为false

  if (__DEV__) {
    checkDuplicateKeys(newCh) // 检查重复的key
  }

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 遍历oldCh和newCh
    if (isUndef(oldStartVnode)) {
      // 如果oldStartVnode不存在
      oldStartVnode = oldCh[++oldStartIdx] // 获取下一个oldStartVnode
    } else if (isUndef(oldEndVnode)) {
      // 如果oldEndVnode不存在
      oldEndVnode = oldCh[--oldEndIdx] // 获取上一个oldEndVnode
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      // 如果oldStartVnode和newStartVnode相同
      patchVnode(
        // 修补vnode
        oldStartVnode,
        newStartVnode,
        insertedVnodeQueue,
        newCh,
        newStartIdx
      )
      oldStartVnode = oldCh[++oldStartIdx] // 获取下一个oldStartVnode
      newStartVnode = newCh[++newStartIdx] // 获取下一个newStartVnode
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 如果oldEndVnode和newEndVnode相同
      patchVnode(
        // 修补vnode
        oldEndVnode,
        newEndVnode,
        insertedVnodeQueue,
        newCh,
        newEndIdx
      )
      oldEndVnode = oldCh[--oldEndIdx] // 获取上一个oldEndVnode
      newEndVnode = newCh[--newEndIdx] // 获取上一个newEndVnode
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // 如果oldStartVnode和newEndVnode相同
      // Vnode向右移动
      patchVnode(
        // 修补vnode
        oldStartVnode,
        newEndVnode,
        insertedVnodeQueue,
        newCh,
        newEndIdx
      )
      canMove &&
        nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm)) // 在oldEndVnode.elm的下一个节点之前插入oldStartVnode.elm
      oldStartVnode = oldCh[++oldStartIdx] // 获取下一个oldStartVnode
      newEndVnode = newCh[--newEndIdx] // 获取上一个newEndVnode
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // 如果oldEndVnode和newStartVnode相同
      // Vnode向左移动
      patchVnode(
        // 修补vnode
        oldEndVnode,
        newStartVnode,
        insertedVnodeQueue,
        newCh,
        newStartIdx
      )
      canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm) // 在oldStartVnode.elm之前插入oldEndVnode.elm
      oldEndVnode = oldCh[--oldEndIdx] // 获取上一个oldEndVnode
      newStartVnode = newCh[++newStartIdx] // 获取下一个newStartVnode
    } else {
      if (isUndef(oldKeyToIdx))
        // 如果oldKeyToIdx不存在
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx) // 创建一个key到索引的映射
      idxInOld = isDef(newStartVnode.key) // 如果newStartVnode.key存在
        ? oldKeyToIdx[newStartVnode.key]
        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx) // 在oldCh中找到newStartVnode的索引
      if (isUndef(idxInOld)) {
        // 如果idxInOld不存在
        // 新元素
        createElm(
          newStartVnode,
          insertedVnodeQueue,
          parentElm,
          oldStartVnode.elm,
          false,
          newCh,
          newStartIdx
        )
      } else {
        vnodeToMove = oldCh[idxInOld] // 获取oldCh[idxInOld]
        if (sameVnode(vnodeToMove, newStartVnode)) {
          // 如果vnodeToMove和newStartVnode相同
          patchVnode(
            // 修补vnode
            vnodeToMove,
            newStartVnode,
            insertedVnodeQueue,
            newCh,
            newStartIdx
          )
          oldCh[idxInOld] = undefined // 将oldCh[idxInOld]置为undefined
          canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm) // 在oldStartVnode.elm之前插入vnodeToMove.elm
        } else {
          // 相同的键但不同的元素。视为新元素
          createElm(
            newStartVnode,
            insertedVnodeQueue,
            parentElm,
            oldStartVnode.elm,
            false,
            newCh,
            newStartIdx
          )
        }
      }
      newStartVnode = newCh[++newStartIdx] // 获取下一个newStartVnode
    }
  }
  if (oldStartIdx > oldEndIdx) {
    // 如果oldStartIdx大于oldEndIdx
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm // 获取refElm
    addVnodes(
      // 添加子节点
      parentElm,
      refElm,
      newCh,
      newStartIdx,
      newEndIdx,
      insertedVnodeQueue
    )
  } else if (newStartIdx > newEndIdx) {
    // 如果newStartIdx大于newEndIdx
    removeVnodes(oldCh, oldStartIdx, oldEndIdx) // 删除子节点
  }
}
```

### 5、整体流程

```shell
new Vue
  ↓
init
  ↓
$mount
  ↓
compile
  ↓
render
  ↓
vnode
  ↓
patch
  ↓
DOM
```
