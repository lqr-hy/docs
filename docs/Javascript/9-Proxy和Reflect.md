# Proxy和Reflect

### 1、`Object.defineProperty` 数据劫持

`Object.defineProperty` 方法会直接在对象上定义一个新的属性，或者修改一个对象的现有属性，并返回次对象。

该方法接受三个参数，第一个是要定义属性的对象，第二个是要定义或修改属性的名称，第三个参数是要定义或修改的属性描述符。

```js
const obj = {}
Object.defineProperty(obj, 'prop', {
  value: 18
})
console.log(obj.prop) // 18
```

函数的第三个参数属性描述符有两种形式：数据描述符和存取描述符。

数据描述符是一个具有值的属性，该值可以是可写的，也可以是不可写的。存取描述符是由 getter 和 setter 所描述的属性。这两种描述符是互斥的。

1. 这两种同时拥有下列两种键值：

> -   configurable：当且仅当该属性为 true 时，该属性的描述符才能被改变，同时该属性也能从对应的对象上被删除，默认为 false；
> -   enumerable：当且仅当该属性为 true 时，该属性才会出现在对象的枚举属性中，默认为 false。

2. 数据描述符还具有以下的可选键值：

> -   value：该属性对应的值，可以是任意有效的 JS 值，默认为 undefined；
> -   writable：当且仅当该属性为 true 时，当前属性对应的值（也就是上面的 value）才能被赋值运算符改变，默认为 false。

3. 存取描述符还具有以下的可选键值：

> -   get：属性的 getter 函数，当访问该属性时，会调用此函数。执行时不传入任何参数，但是会传入 this 对象（由于继承关系，这里的 this 并不一定是定义该属性的对象）。该函数的返回值被用作属性的值；
> -   set：属性的 setter 函数，当属性值被修改时会调用此函数。该方法会接收一个参数（被赋予的新值），会传入赋值时的 this 对象。

### 2、Proxy 数据拦截

`Object.defineProperty` 只能对对象中现有的键进行拦截，对于动态新增的键是无能为力的。同时 `Object.defineProperty` 只能重定义获取和设置行为。

而 Proxy 相当于一个升级，它可以进行更多的重定义。

#### 1、概念

首先 Proxy 是一个构造函数，可以通过 new 来创建它的实例。它接受两个参数，第一个是被拦截的目标对象，第二个是 handler：一个通常以函数作为属性的对象，各属性中的函数分别定义了在执行各种操作时代理实例的行为。

```js
const p = new Proxy(target, handler)
```

#### 2、`handler` 对象的属性

handler 中的所有属性都是可选的，如果没有定义，那就会保留原对象的默认行为。

#### 3、`get`

对象的 getter 函数，用于拦截对象的读取操作。

#### 4、`set`

对象的 setter 函数，用于拦截设置属性值的操作行为。

#### 5、`apply`

用于拦截函数的调用。当需要被代理拦截的对象是一个函数的时候，可以通过设置 apply 来进行拦截。

#### 6、`has`

用于拦截 in 操作符的代理。当对目标对象使用 in 操作符时，会触发这个函数的执行。

#### 7、`construct`

用于拦截 new 操作符。为了使 new 操作符在生成的 Proxy 对象上生效，用于初始化代理的目标对象本身必须具有 `[[Construct]]` 内部方法（即 `new Target` 必须是有效的）。

#### 8、`delete`

用于拦截 delete 操作符。用于拦截对对象属性进行 delete 操作。

#### 9、`defineProperty`

用于拦截对象属性上的 `Object.defineProperty` 。当对对象进行键代理时，会触发这个方法。

#### 10、`getOwnPropertyDescriptor`

用于拦截 `Object.getOwnPropertyDescriptor` 。

#### 11、`getPrototypeOf`

当访问对象的原型时，会触发这个方法。

触发这个方法的条件有五个：

> -   `Object.getPrototypeOf()`
> -   `Reflect.getPrototypeOf()`
> -   `__proto__`
> -   `Object.prototype.isPrototypeOf()`
> -   `instanceof`

#### 12、`isExtensible`

用于拦截对象的 `Object.isExtensible()`

#### 13、`ownKeys`

用于拦截对象自身属性的读取操作。

具体拦截如下：

> -   `Object.getOwnPropertyNames()`
> -   `Object.getOwnPropertySymbols()`
> -   `Object.keys()`
> -   `for...in 循环`

该方法有几个约束条件：

> -   ownKeys 结果必须是一个数组
> -   数组的元素类型要么是字符串要么是 Symbol
> -   结果列表必须包含目标对象的所有不可配置（non-configurable）、自由属性的 key
> -   如果目标对象不可扩展，那么结果列表必须包含目标对象的所有自由属性的 key，不能有其他值

#### 14、`preventExtensions`

用于设置对 `Object.perventExtensions` 的拦截。

#### 15、`setPrototypeOf`

用来拦截 `Object.setPrototypeOf` 。

::: details Object.defineProperty() 和 Proxy区别
```js
const obj = {}
Object.defineProperty(obj, 'prop', {
  get() {
    console.log('get val')
  },
  set(newVal) {
    console.log(newVal)
    document.getElementById('input').value = newVal
  }
})

const input = document.getElementById(input)
input.addEventListener('keyup', function(e) {
  obj.text = e.target.value
})
```
> 缺点: 那就是只能对对象的属性进行监听，如果需要监听多个属性，则需要进行遍历。同时，这个 API 无法监听数组。
> 
> 优点: 就是兼容性好。


```js
const input = document.getElementById(input)
const obj = {}

const newobj = new Proxy(obj, {
  get(target, key, receiver) {
    console.log(`getting ${key}`)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    console.log(target, key, value, receiver) 
    if(key === 'text') {
      input.value = value
    }
    return Reflect.set(target, key, value, receiver)
  }
})

input.addEventListener('keyup', function(e) {
  obj.text = e.target.value
})
```

> 优点：Proxy 可以对整个对象进行代理拦截，并且返回一个新的对象。除此之外还可以对数组进行拦截。
>
> 缺点：Proxy 最大的问题便是兼容性不好，并且无法通过 polyfill 磨平。
:::

### 2、Reflect

#### 1、概念

Reflect 不是一个构造函数，所以使用时不需要用 `new` 来进行创建。

Reflect 字面意思是反射，比较晦涩难懂，ES6新增这个对象的主要目的是：

> -   将 Object 对象的一些明显属于语言内部的方法（比如 `Object.defineProperty` ）放到 Reflect 对象上。现阶段，某些方法同时部署在两个对象上，未来新方法只会部署在 Reflect 对象上。也就是说，从 Reflect 对象上可以拿到语言内部的方法；
> -   修改某些 Object 方法的返回结果，让其变得更合理。比如：`Object.defineProperty ` 在无法定义属性时会抛出一个错误，而 `Reflect.defineProperty` 则会返回 false；
> -    让 Object 操作都变成函数行为。某些 Object 操作是命令行为，比如 `key in obj` 和 `delete obj[key]` ，而 `Reflect.has(obj, name)` 和 `Reflect.delete(obj, name)` 让它们变成函数行为；
> -   Reflect 对象的方法与 Proxy 对象的方法一一对应，只要是 Proxy 对象的方法，就能在 Reflect 对象上找到对应的方法。这就让 Proxy 对象可以方便地调用对应的 Reflect 方法，完成默认行为，作为修改行为的基础。也就是说，不管 Proxy 怎么修改默认行为，你总可以在 Reflect 上获取默认行为。

```js
const loggedObj = new Proxy(obj, {
  get(target, name) {
    console.log('get', target, name)
    return Reflect.get(target, name)
  },
  deleteProperty(target, name) {
    console.log('delete' + name)
    return Reflect.deleteProperty(target, name)
  },
  has(target, name) {
    console.log('has' + name)
    return Reflect.has(target, name)
  }
})
```

上面代码中，每一个 Proxy 对象的拦截操作（get、delete、has）内部都调用对应的 Reflect 方法，保证原生行为能够正常执行。添加的工作，就是将每一个操作输出一行日志。

Reflect 拥有 13 个静态 API，其大部分与 Object 对象的同名方法作用都是相同的，而且它与 Proxy 对象的方法是一一对应的。

#### 2、`Reflect.apply()`

通过制定的参数列表发起对目标函数的调用。该方法接受三个参数：

> -   target：目标函数
> -   thisArgument：target 函数调用时绑定的 this 对象
> -   argumentsList：目标函数调用时传入的实参

该方法与 `Function.prototype.apply` 类似，但是更加通俗易懂。

#### 3、`Reflect.construct()`

该方法的行为有点和 new 操作符类似，相当于 `new Target(...args)` 。

该方法接受三个参数：

> -   target：被运行的构造函数
> -   argumentList：累数组，目标构造函数调用时的实参
> -   newTarget（可选）：作为新创建对象的原型对象的 constructor 属性，默认为 target

#### 4、`Reflect.defineProperty()`

基本等价于 `Object.definePropery` ，唯一的区别在于当无法进行监听时，`Reflect.defineProperty` 会返回 false，而 `Object.defineProperty` 会报错。

#### 5、`Reflect.deleteProperty()`

该方法用于删除对象上的属性，作用等价于 `delete obj[name]` ，但是它是一个函数，接受两个参数：

> -   target：删除属性的目标对象
> -   propertyKey：需要删除的属性的名称

#### 6、`Reflect.get()`

该方法与直接从对象上读取属性类似，但是它是通过一个函数执行操作。该方法接受三个参数：

> -   target：需要取值的目标对象
> -   propertyKey：需要获取的值的键
> -   receiver：如果 target 对象中指定了 getter，receiver 则为 getter 调用时的 this 值。

如果 target 不是一个对象则会报错。

#### 7、`Reflect.getOwnPropertyDescriptor()`

该方法与 `Object.getOwnPropertyDescriptor` 一致，用户返回对象中给定属性的属性描述符。

#### 8、`Reflect.getPrototypeOf()`

该方法与 `Object.getProrotypeOf` 一致，用户返回给定对象的原型。

#### 9、`Reflect.has()`

该方法作用于 `key in obj` 相类似，但它是一个函数，接受两个参数：

> -   target：目标对象
> -   propertyKey：属性名

如果 target 不是一个对象，会报错。

#### 10、`Reflect.isExtensible()`

判断一个对象是否可扩展，和 `Object.isExtensible` 相类似，区别在于 `Reflect.isExtensible` 如果第一个参数不是一个对象会报错，而 `Object.isExtensible` 则会强制将它转换成一个对象。

#### 11、`Reflect.ownKeys()`

返回一个由目标自身属性键组成的数组。

该方法等价于 `Object.getOwnPropertyName(target).concat(Object.getOwnPropertySymbols(target))` 

#### 12、`Reflect.preventExtensions()`

该方法阻止新属性添加到对象。

#### 13、`Reflect.set()`

该方法作用和直接设置对象属性相同，接受四个参数：

> -   target：设置属性的目标对象
> -   propertyKey：设置的属性名称
> -   value：设置的值
> -   receiver：如果遇到 setter，receiver 则为 setter 调用时 this

#### 14、`Reflect.setProrotypeOf()`

该方法可以设置一个对象的原型对象，结果返回一个布尔值。
