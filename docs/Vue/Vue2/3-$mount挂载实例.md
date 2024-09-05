# Vue 实例挂载的实现

### 1、执行模版编译和挂载 runtime-with-complier.ts

```ts
const idToTemplate = cached((id) => {
  // 缓存id对应的模板
  const el = query(id)
  return el && el.innerHTML
})

const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (el?: string | Element, hydrating?: boolean): Component {
  el = el && query(el) // 获取el元素

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    // 不要挂载到html或body上，而是挂载到普通元素上
    __DEV__ && warn(`Do not mount Vue to <html> or <body> - mount to normal elements instead.`)
    return this
  }

  const options = this.$options // 获取实例的$options
  // resolve template/el and convert to render function
  if (!options.render) {
    // 如果没有render函数
    let template = options.template // 获取template
    if (template) {
      // 如果有template
      if (typeof template === 'string') {
        // 如果template是字符串
        if (template.charAt(0) === '#') {
          // 如果template是id选择器
          template = idToTemplate(template) // 获取id对应的模板
          /* istanbul ignore if */
          if (__DEV__ && !template) {
            warn(`Template element not found or is empty: ${options.template}`, this)
          }
        }
      } else if (template.nodeType) {
        // 如果template是节点
        template = template.innerHTML // 获取节点的innerHTML
      } else {
        if (__DEV__) {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // 如果没有template但是有el
      // @ts-expect-error
      template = getOuterHTML(el) // 获取el的outerHTML
    }
    if (template) {
      /* istanbul ignore if */
      if (__DEV__ && config.performance && mark) {
        mark('compile')
      }

      const { render, staticRenderFns } = compileToFunctions(
        // 编译template
        template,
        {
          outputSourceRange: __DEV__,
          shouldDecodeNewlines,
          shouldDecodeNewlinesForHref,
          delimiters: options.delimiters,
          comments: options.comments
        },
        this
      )
      options.render = render // 将render函数挂载到$options上
      options.staticRenderFns = staticRenderFns // 将staticRenderFns挂载到$options上

      /* istanbul ignore if */
      if (__DEV__ && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating) // 调用原来的$mount方法 ->  runtime 里面的$mount 挂载组件
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML(el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions
```

### 2、web/runtime.ts $mount 执行

1. 设置渲染函数：

   - 如果组件没有定义渲染函数，则设置一个默认的渲染函数，防止渲染时报错。

2. 调用 beforeMount 钩子：

   - 在组件挂载之前调用 beforeMount 生命周期钩子。

3. 定义更新函数：

   - 定义一个更新函数 updateComponent，该函数会调用组件的渲染函数生成 VNode，并将其更新到 DOM 中。

4. 创建 Watcher 实例：

   - 创建一个 Watcher 实例，绑定更新函数 updateComponent，并在数据变化时重新渲染组件。

5. 标记组件已挂载：

   - 将组件实例的 \_isMounted 标记为 true，表示组件已经挂载。

6. 调用 mounted 钩子：

   - 在组件挂载完成后调用 mounted 生命周期钩子。

```ts
Vue.prototype.$mount = function (el?: string | Element, hydrating?: boolean): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating) // 挂载组件
}

function mountComponent(
  vm: Component,
  el: Element | null | undefined,
  hydrating?: boolean
): Component {
  vm.$el = el // 挂载元素
  if (!vm.$options.render) {
    // @ts-expect-error invalid type
    vm.$options.render = createEmptyVNode // 创建空的VNode
  }
  callHook(vm, 'beforeMount') // 挂载前 生命周期

  let updateComponent // 更新组件

  updateComponent = () => {
    // 更新组件
    vm._update(vm._render(), hydrating) // 更新组件
  }

  const watcherOptions: WatcherOptions = {
    before() {
      if (vm._isMounted && !vm._isDestroyed) {
        // 如果已经挂载并且没有销毁
        callHook(vm, 'beforeUpdate') // 更新前 生命周期
      }
    }
  }

  // 我们在观察者的构造函数中将其设置为vm._watcher
  // 因为观察者的初始补丁可能会调用$forceUpdate（例如在子组件的mounted钩子中），
  // 这依赖于vm._watcher已经定义
  new Watcher(vm, updateComponent, noop, watcherOptions, true /* isRenderWatcher */) // 渲染watch
  hydrating = false

  // flush buffer for flush: "pre" watchers queued in setup()
  const preWatchers = vm._preWatchers // 提前观察者
  if (preWatchers) {
    for (let i = 0; i < preWatchers.length; i++) {
      preWatchers[i].run()
    }
  }

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted') // 挂载后 生命周期
  }
  return vm
}
```

`mountComponent` 核心就是先实例化一个渲染`Watcher`，在它的回调函数中会调用 `updateComponent` 方法，在此方法中调用 `vm._render` 方法先生成虚拟 Node，最终调用 `vm._update` 更新 DOM。

`Watcher` 在这里起到两个作用，一个是初始化的时候会执行回调函数，另一个是当 vm 实例中的监测的数据发生变化的时候执行回调函数。

### 3、render 函数

```ts
Vue.prototype._render = function (): VNode {
const vm: Component = this
const { render, _parentVnode } = vm.$options // 获取render函数

if (_parentVnode && vm._isMounted) {
  // 如果有父vnode并且已经挂载
  vm.$scopedSlots = normalizeScopedSlots(
    // 规范化作用域插槽
    vm.$parent!,
    _parentVnode.data!.scopedSlots,
    vm.$slots,
    vm.$scopedSlots
  )
  if (vm._slotsProxy) {
    // 如果有插槽代理
    syncSetupSlots(vm._slotsProxy, vm.$scopedSlots) // 同步设置插槽
  }
}

// 设置父vnode。这允许渲染函数访问
// 到占位符节点上的数据。
vm.$vnode = _parentVnode!
// render self
const prevInst = currentInstance // 保存当前实例
const prevRenderInst = currentRenderingInstance // 保存当前渲染实例
let vnode // 虚拟节点
try {
  setCurrentInstance(vm) // 设置当前实例
  currentRenderingInstance = vm // 设置当前渲染实例
  vnode = render.call(vm._renderProxy, vm.$createElement) // 调用render函数 生成虚拟节点
} catch (e: any) {
  handleError(e, vm, `render`)
  ...
} finally {
  currentRenderingInstance = prevRenderInst // 恢复当前渲染实例
  setCurrentInstance(prevInst) // 恢复当前实例
}
// 如果返回的数组只包含一个节点，请允许它
if (isArray(vnode) && vnode.length === 1) {
  // 如果是数组并且长度为1
  vnode = vnode[0]
}
// 如果渲染函数出错，则返回空的vnode
if (!(vnode instanceof VNode)) {
  vnode = createEmptyVNode()
}
vnode.parent = _parentVnode // 设置父节点
return vnode // 返回虚拟节点
}
```

`_render`通过过执行 `createElement` 方法返回 `vnode`
