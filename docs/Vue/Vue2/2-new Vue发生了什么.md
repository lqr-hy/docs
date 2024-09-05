# new Vue 发生了什么

Vue.js 的初始化过程涉及从创建 Vue 实例到完成数据绑定、模板编译和 DOM 渲染等一系列步骤。了解这些步骤有助于深入理解 Vue.js 的工作机制。以下是 Vue.js 初始化的主要步骤：

### 1. **Vue 实例的创建**

当我们调用 `new Vue(options)` 时，就会开始 Vue 实例的创建过程。`options` 对象通常包含 `data`, `methods`, `computed`, `watch`, `el`, `template`, `components` 等选项。

```javascript
const vm = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  }
})
```

### 2. **初始化内部状态**

在 Vue 实例的构造函数中，Vue 会对传入的 `options` 进行处理，并初始化实例的一些核心功能，包括以下几部分：

- **事件系统**：初始化事件侦听器和事件触发器。
- **生命周期函数**：Vue 会在实例的生命周期不同阶段调用相应的钩子函数，比如 `beforeCreate`、`created` 等。
- **响应式数据**：Vue 会对 `data` 对象进行响应式处理，使得当数据变化时，视图能够自动更新。

```javascript
const vm = new Vue({
  data: {
    message: 'Hello Vue!'
  },
  created() {
    console.log('Vue instance created')
  }
})
```

### 3. **数据响应式的实现**

Vue 使用 `Object.defineProperty`来将数据对象的每一个属性转换为 getter 和 setter。当数据发生变化时，这些 getter 和 setter 会通知依赖于这些数据的视图进行更新。

```javascript
data() {
  return {
    message: 'Hello Vue!'
  };
}
```

在 Vue 2.x 中，数据响应式依赖于 `Object.defineProperty` 的 getter 和 setter 进行数据劫持和依赖追踪。

### 4. **模板编译**

如果 `options` 中包含 `template` 或 `el` 选项，Vue 将会对模板进行编译。编译的结果是一个渲染函数，该函数在每次数据更新时都会被调用。

- **模板解析**：Vue 将模板转换为抽象语法树（AST）。
- **AST 转换为渲染函数**：编译器将 AST 转换为渲染函数（`render` 函数）。
- **渲染函数**：渲染函数返回一个 VNode 树，表示页面的 DOM 结构。

```javascript
const vm = new Vue({
  el: '#app',
  template: '<p>{{ message }}</p>',
  data: {
    message: 'Hello Vue!'
  }
})
```

### 5. **挂载 (Mounting)**

Vue 会将生成的 VNode 渲染为真实的 DOM 节点，并插入到 `el` 指定的元素中。

- **虚拟 DOM**：Vue 使用虚拟 DOM 来表示组件的视图状态。虚拟 DOM 是一个轻量级的 JavaScript 对象树。
- **真实 DOM 渲染**：Vue 将虚拟 DOM 转换为真实 DOM 并挂载到 `el` 指定的元素上。

在这一阶段，Vue 会调用 `beforeMount` 和 `mounted` 生命周期钩子。

```javascript
const vm = new Vue({
  el: '#app',
  template: '<p>{{ message }}</p>',
  data: {
    message: 'Hello Vue!'
  },
  mounted() {
    console.log('Vue instance mounted')
  }
})
```

### 6. **更新**

当 Vue 实例中的数据发生变化时，响应式系统会自动触发视图的更新。更新的过程会调用 `beforeUpdate` 和 `updated` 钩子函数。

- **数据变更**：当数据发生变化时，setter 会通知依赖于该数据的渲染函数。
- **虚拟 DOM 重新渲染**：Vue 会通过对比新旧虚拟 DOM 树的差异（diff 算法），只更新需要更新的部分。
- **更新真实 DOM**：最终将变化应用到真实的 DOM 上。

### 7. **销毁 (Destruction)**

当一个 Vue 实例不再需要时，我们可以通过调用 `$destroy` 方法销毁该实例。在实例销毁的过程中，Vue 会调用 `beforeDestroy` 和 `destroyed` 生命周期钩子。

- **事件解绑**：销毁过程中，Vue 会解除所有事件监听。
- **依赖清理**：Vue 会移除所有的依赖和数据绑定。
- **DOM 清理**：Vue 会移除挂载的 DOM 元素。

```javascript
vm.$destroy()
```

### 总结

Vue.js 的初始化过程从实例创建开始，通过一系列步骤，完成对数据的响应式处理、模板编译和 DOM 渲染，最终生成一个可交互的用户界面。理解这些步骤有助于开发者更好地掌握 Vue.js 的使用和优化应用性能。

### 源码分析

::: details 源码分析

```ts
// 真正执行new Vue的入口
import Vue from './instance/index'
// 初始化全局api
import { initGlobalAPI } from './global-api/index'
import { version } from 'v3'

// 初始化全局API 
// Vue.config Vue.util Vue.set Vue.delete Vue.nextTick 
// Vue.observable Vue.options Vue.mixin Vue.extend Vue.component Vue.directive Vue.filter
initGlobalAPI(Vue) 


Vue.version = version

export default Vue

// ./instance/index
function Vue(options) {
  if (__DEV__ && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue) //  初始化Vue实例 Vue.prototype._init
stateMixin(Vue) // 初始化Vue实例的 Vue.prototype.$set Vue.prototype.$delete Vue.prototype.$watch
eventsMixin(Vue) // 初始化Vue实例的事件系统 Vue.prototype.$on Vue.prototype.$once Vue.prototype.$off Vue.prototype.$emit
lifecycleMixin(Vue) // 初始化Vue更新销毁函数 Vue.prototype._update Vue.prototype.$forceUpdate Vue.prototype.$destroy
renderMixin(Vue) // 初始化Vue实例的渲染 Vue.prototype.$nextTick Vue.prototype._render

function initMixin(Vue: typeof Component) {
  Vue.prototype._init = function (options?: Record<string, any>) {
    const vm: Component = this
    // 用于标识每个实例
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (__DEV__ && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // 用于标识这是一个Vue实例，而不必进行instanceof检查
    vm._isVue = true

    // 避免实例被观察
    vm.__v_skip = true
    // 影响范围
    vm._scope = new EffectScope(true /* detached */)
    // 父组件渲染
    vm._scope.parent = undefined
    vm._scope._vm = true
    //  合并参数
    if (options && options._isComponent) {
      // 优化内部组件实例化
      // 由于动态选项合并非常慢，而且没有
      // 内部组件选项需要特殊处理。
      initInternalComponent(vm, options as any)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor as any),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (__DEV__) {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // 暴露真实的self
    vm._self = vm
    initLifecycle(vm) // 初始化生命周期
    initEvents(vm) // 初始化事件
    initRender(vm) // 初始化渲染
    callHook(vm, 'beforeCreate', undefined, false /* setContext */) // 在数据/props之前解析生命周期钩子
    initInjections(vm) // 在数据/props之前解析注入
    initState(vm) // 初始化数据/props
    initProvide(vm) // 在数据/props之后解析提供
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (__DEV__ && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}
```

:::
