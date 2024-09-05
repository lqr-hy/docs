# Virtual Dom

### 1、VNode 生成虚拟节点

#### 1、VNode 的意义和作用

- 性能优化：

> 直接操作真实 DOM 是昂贵的，因为每次操作都会引发浏览器的重绘和重排。通过使用 VNode，可以在内存中进行大量的 DOM 操作，然后一次性将变化应用到真实 DOM 中，从而减少性能开销。

- 跨平台：

> VNode 是平台无关的表示，可以在不同的渲染环境中使用，如浏览器、服务器端渲染（SSR）和移动端。

- 简化开发：

> 使用 VNode，可以更容易地描述和管理复杂的 UI 结构。开发者可以通过声明式的方式定义 UI，而不需要直接操作 DOM。

- 差异更新：

> 通过比较新旧 VNode 树的差异（diffing），可以高效地更新真实 DOM。只更新发生变化的部分，而不是重新渲染整个页面。

```ts
export default class VNode {
  tag?: string // 标签名
  data: VNodeData | undefined // 节点数据
  children?: Array<VNode> | null // 子节点
  text?: string // 文本
  elm: Node | undefined // 真实节点
  ns?: string // 命名空间
  context?: Component // rendered in this component's scope // 在此组件的范围内呈现
  key: string | number | undefined // key
  componentOptions?: VNodeComponentOptions // 组件选项
  componentInstance?: Component // component instance // 组件实例
  parent: VNode | undefined | null // component placeholder node // 组件占位符节点

  // strictly internal
  raw: boolean // contains raw HTML? (server only) // 包含原始HTML？（仅服务器）
  isStatic: boolean // hoisted static node // 提升的静态节点
  isRootInsert: boolean // necessary for enter transition check // 必要的进入转换检查
  isComment: boolean // empty comment placeholder? // 空注释占位符？
  isCloned: boolean // is a cloned node? // 是克隆节点吗？
  isOnce: boolean // is a v-once node? // 是v-once节点吗？
  asyncFactory?: Function // async component factory function // 异步组件工厂函数
  asyncMeta: Object | void // real meta on async node // 异步节点上的真实元数据
  isAsyncPlaceholder: boolean
  ssrContext?: Object | void
  fnContext: Component | void // real context vm for functional nodes // 功能节点的真实上下文vm
  fnOptions?: ComponentOptions | null // for SSR caching
  devtoolsMeta?: Object | null // used to store functional render context for devtools // 用于为devtools存储功能渲染上下文
  fnScopeId?: string | null // functional scope id support
  isComponentRootElement?: boolean | null // for SSR directives

  constructor(
    tag?: string,
    data?: VNodeData,
    children?: Array<VNode> | null,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.ns = undefined
    this.context = context
    this.fnContext = undefined
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.key = data && data.key
    this.componentOptions = componentOptions
    this.componentInstance = undefined
    this.parent = undefined
    this.raw = false
    this.isStatic = false
    this.isRootInsert = true
    this.isComment = false
    this.isCloned = false
    this.isOnce = false
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  get child(): Component | void {
    return this.componentInstance
  }
}
```

### 2、VNode 通过 createElement 方法创建

```ts
export function createElement(
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  if (isArray(data) || isPrimitive(data)) {
    // 如果data是数组或者是原始值
    normalizationType = children // children赋值给normalizationType
    children = data // data赋值给children
    data = undefined // data设置为undefined
  }
  if (isTrue(alwaysNormalize)) {
    // 如果alwaysNormalize为true
    normalizationType = ALWAYS_NORMALIZE // normalizationType设置为ALWAYS_NORMALIZE
  }
  return _createElement(context, tag, data, children, normalizationType) // 创建一个VNode
}

export function _createElement(
  context: Component, // 上下文
  tag?: string | Component | Function | Object, // tag可以是字符串、组件、函数、对象
  data?: VNodeData, // VNodeData类型
  children?: any, // children可以是任意类型
  normalizationType?: number // 子级规范化类型
): VNode | Array<VNode> {
  if (isDef(data) && isDef((data as any).__ob__)) {
    return createEmptyVNode()
  }
  // v-bind中的对象语法
  if (isDef(data) && isDef(data.is)) {
    tag = data.is // 获取tag
  }
  if (!tag) {
    // 如果组件:is设置为falsy值
    return createEmptyVNode()
  }
  // 支持单个函数子级作为默认作用域插槽
  if (isArray(children) && isFunction(children[0])) {
    data = data || {} // 如果data不存在，设置为空对象
    data.scopedSlots = { default: children[0] } // 设置默认作用域插槽
    children.length = 0 // 清空children
  }
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children) // 规范化子级
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children) // 简单规范化子级
  }
  let vnode, ns
  if (typeof tag === 'string') {
    let Ctor
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag) // 获取命名空间
    if (config.isReservedTag(tag)) {
      // 如果是保留标签
      vnode = new VNode( // 创建一个VNode
        config.parsePlatformTagName(tag),
        data,
        children,
        undefined,
        undefined,
        context
      )
    } else if (
      (!data || !data.pre) &&
      isDef((Ctor = resolveAsset(context.$options, 'components', tag))) // 如果没有data或者data.pre为false 并且Ctor存在
    ) {
      // component
      vnode = createComponent(Ctor, data, context, children, tag) // 创建一个组件
    } else {
      // 未知或未列出的命名空间元素
      // 在运行时检查，因为它可能在其被创建时分配一个命名空间
      // 父级规范化子级
      vnode = new VNode(tag, data, children, undefined, undefined, context) // 创建一个VNode
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag as any, data, context, children) // 创建一个组件
  }
  if (isArray(vnode)) {
    return vnode // 返回一个VNode数组
  } else if (isDef(vnode)) {
    if (isDef(ns)) applyNS(vnode, ns) // 如果有命名空间，应用命名空间
    if (isDef(data)) registerDeepBindings(data) // 如果有data，注册深度绑定
    return vnode
  } else {
    return createEmptyVNode() // 创建一个空的VNode
  }
}
```

1. 规范子节点 `simpleNormalizeChildren` 1. 当子组件包含组件时-因为函数组件可能返回一个数组而不是一个单一的根。在这种情况下，只是一个简单的 规范化是必要的-如果任何子级是一个数组，我们将整个 事情与 Array.prototype.concat。它保证只有 1 级深因为功能组件已经规范化了自己的子组件。

2. `normalizeChildren` 当子组件包含总是生成嵌套数组的构造时，例如`<template>`、`<slot>`、`v-for`，或者当子组件由用户提供时 用手写的渲染函数/JSX 提供。在这种情况下，完全规范化是需要的，以满足所有可能的子级值类型。

```ts
function simpleNormalizeChildren(children: any) {
  // 规范化子组件
  for (let i = 0; i < children.length; i++) {
    if (isArray(children[i])) {
      return Array.prototype.concat.apply([], children) // 将多维数组转换为一维数组
    }
  }
  return children
}

function normalizeChildren(children: any): Array<VNode> | undefined {
  return isPrimitive(children) // 如果children是原始值
    ? [createTextVNode(children)] // 创建文本VNode
    : isArray(children) // 如果children是数组
    ? normalizeArrayChildren(children)
    : undefined
}
```

### 3、通过 createComponent 创建 VNode

1. 检查构造函数是否定义：

   - 如果 Ctor 未定义，直接返回。

2. 处理构造函数：

   - 如果 Ctor 是一个对象，将其转换为构造函数。
   - 如果 Ctor 不是函数，且在开发环境中，发出警告并返回。

3. 处理异步组件：

   - 如果 Ctor 没有 cid，将其视为异步组件工厂，并尝试解析异步组件。
   - 如果解析失败，返回一个异步占位符节点。

4. 解析构造函数选项：

   - 解析构造函数选项，以防全局混入在组件构造函数创建后应用。

5. 处理 v-model 数据：

   - 将组件的 v-model 数据转换为 props 和事件。

6. 提取 props 数据：

   - 从 VNodeData 中提取 props 数据。

7. 处理功能组件：

   - 如果组件是功能组件，调用 createFunctionalComponent 创建功能组件的 VNode。

8. 提取和处理事件监听器：

   - 提取事件监听器，并将其替换为带有 .native 修饰符的监听器。

9. 处理抽象组件：

   - 如果组件是抽象组件，只保留 props、监听器和插槽。

10. 安装组件管理钩子：

    - 将组件管理钩子安装到占位符节点上。

11. 创建并返回 VNode：

    - 创建一个新的 VNode，并返回。

```ts
export function createComponent(
  Ctor: typeof Component | Function | ComponentOptions | void,
  data: VNodeData | undefined,
  context: Component,
  children?: Array<VNode>,
  tag?: string
): VNode | Array<VNode> | void {
  // 创建组件
  if (isUndef(Ctor)) {
    // 如果Ctor为undefined
    return
  }

  const baseCtor = context.$options._base

  // 简单的选项对象：将其转换为构造函数
  if (isObject(Ctor)) {
    // 如果Ctor是一个对象
    Ctor = baseCtor.extend(Ctor as typeof Component)
  }

  // 如果在这个阶段它不是构造函数或异步组件工厂
  if (typeof Ctor !== 'function') {
    if (__DEV__) {
      warn(`Invalid Component definition: ${String(Ctor)}`, context)
    }
    return
  }

  // 异步组件
  let asyncFactory
  if (isUndef(Ctor.cid)) {
    // 如果Ctor.cid为undefined
    asyncFactory = Ctor // 异步工厂
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor) // 解析异步组件
    if (Ctor === undefined) {
      // 如果Ctor为undefined
      // 为异步组件返回一个占位符节点，该节点被渲染
      // 作为注释节点，但保留节点的所有原始信息。
      // 信息将用于异步服务器呈现和水合作用。
      return createAsyncPlaceholder(asyncFactory, data, context, children, tag) // 创建一个异步占位符
    }
  }

  data = data || {}

  // 在应用全局混合后解析构造函数选项
  // 组件构造函数创建
  resolveConstructorOptions(Ctor as typeof Component) // 解析构造函数选项

  // 将组件v-model数据转换为props和事件
  if (isDef(data.model)) {
    transformModel(Ctor.options, data) // 转换模型
  }

  const propsData = extractPropsFromVNodeData(data, Ctor, tag) // 从VNodeData中提取props

  if (isTrue(Ctor.options.functional)) {
    // 如果Ctor.options.functional为true
    return createFunctionalComponent(
      // 创建功能组件
      Ctor as typeof Component,
      propsData,
      data,
      context,
      children
    )
  }

  // 提取侦听器，因为这些需要被视为
  // 子组件侦听器而不是DOM侦听器
  const listeners = data.on // 侦听器
  // 用.native修饰符替换侦听器
  // 因此它在父组件补丁期间被处理。
  data.on = data.nativeOn

  if (isTrue(Ctor.options.abstract)) {
    // 如果Ctor.options.abstract为true
    // 抽象组件不保留任何内容
    // 除了props、侦听器和插槽之外

    const slot = data.slot // 插槽
    data = {}
    if (slot) {
      data.slot = slot
    }
  }

  // 将组件管理钩子安装到占位符节点上
  installComponentHooks(data)

  const name = getComponentName(Ctor.options) || tag // 获取组件名
  const vnode = new VNode( // 创建一个VNode
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`, // 组件名
    data,
    undefined,
    undefined,
    undefined,
    context,
    // @ts-expect-error
    { Ctor, propsData, listeners, tag, children },
    asyncFactory
  )

  return vnode // 返回VNode
}
```
