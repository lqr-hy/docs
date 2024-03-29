# this 绑定

`this` 绑定规则总共有下面 5 种：

*   默认绑定（严格/非严格模式）
*   隐式绑定
*   显式绑定
*   new 绑定
*   箭头函数绑定

### 1、调用位置

调用位置就是函数在代码中 **被调用的位置**（不是声明的位置）。

查找方法：

*   分析调用栈：调用位置就是当前正在执行的函数的 **前一个调用中**
*   使用开发工具得到调用栈：设置断点或者插入 `debugger;` 语句，运行时调试器会在那个位置暂停，同时展示当前位置的函数调用列表，这就是 **调用栈**。找到栈中 **第二个元素**，这就是真正的调用位置。

### 2、绑定规则

#### 1、默认绑定

##### 独立函数调用

可以把默认绑定看作是无法应用其他规则时的默认规则，this 指向 **全局对象**；

##### 2、严格模式

严格模式下，不能将全局对象用于默认绑定，this 会绑定到 undefined。只有函数运行在 非严格模式下，默认绑定才能绑定到全局对象。在严格模式下调用函数则不影响默认绑定。

#### 2、隐式绑定

当函数引用有 **上下文对象** 时，隐式绑定规则会把函数中 this 绑定到这个上下文对象，对象属性引用链只有上一层或者说最后一层在调用中起作用。

##### 1、隐式丢失

被隐式绑定的函数在特定情况下会丢失绑定对象，应用默认绑定，把 this 绑定到全局对象或者 undefined 上。

```js
// 虽然bar是obj.foo的一个引用，但是实际上，它引用的是foo函数本身。
// bar()是一个不带任何修饰的函数调用，应用默认绑定。
function foo() {
    console.log( this.a );
}

var obj = {
    a: 2,
    foo: foo
};

var bar = obj.foo; // 函数别名

var a = "oops, global"; // a是全局对象的属性

bar(); // "oops, global"
```

参数传递就是一种隐式赋值，传入函数时也会被隐式赋值。回调函数丢失 this 绑定是非常常见的。

#### 3、显式绑定

通过 call 或者 apply 方法进行绑定，第一个参数是一个对象，在调用函数时会将这个对象绑定到 this。


:::info call 和 apply区别
apply 第二个参数是数组

显式绑定无法解决绑定丢失问题。
> 因为显式绑定，会立即执行这个函数，回调函数中函数的执行时间是不确定的，所有我们需要提前将this绑定到指定的对象上，在需要的时候调用回调函数时，this是明确的
:::

> bind() 方法会创建一个新函数。当这个新函数被调用时，bind() 的第一个参数将作为它运行时的 this，之后的一序列参数将会在传递的实参前传入作为它的参数
::: details call apply bind实现
```js
function app(a, b) {
console.log('app', this, a + b)
}
let a = { name: '123' }
// app.call(a)

Function.prototype.lqrCall = function (thisArg, ...arg) {
// 接受当前传入的this
// console.log(this)
let fn = this
// 判断是否时null 或者  是undefined
thisArg =
  thisArg !== null || thisArg !== undefined ? Object(thisArg) : window

// 调用需要被执行的函数
thisArg.fn = fn
const result = thisArg.fn(...arg)

delete thisArg.fn

return result
}
app.lqrCall(a, 2, 3)

Function.prototype.lqrApply = function (thisArg, arg) {
// console.log(this)
// 获取当前调用函数
const fn = this

// 传入null 或者undefined 绑定window
thisArg =
  thisArg !== null || thisArg !== undefined ? Object(thisArg) : window
// 将传入函数绑定到需要绑定的对象
thisArg.fn = fn
//判断arg
arg = arg || []
// 执行传入函数
let result = thisArg.fn(...arg)

delete thisArg.fn

return result
}

app.lqrApply(a, [1, 2])

Function.prototype.lqrBind = function (thisArg, ...arg) {
const fn = this

thisArg =
  thisArg !== null || thisArg !== undefined ? Object(thisArg) : window

let resultFun = (...arg2) => {
  thisArg.fn = fn
  let res = thisArg.fn(...[...arg, ...arg2])
  delete thisArg.fn
  return res
}

return resultFun
}

const res = app.lqrBind(a)
res('a', 'b')

// function d(a) {
//   console.log(arguments[1], a)
// }

// d(1, 2, 3, 4, 5)
console.log(Object.prototype.toString.call(123))
```
:::

### 3、new 绑定

在 JS 中，**构造函数** 只是使用 new 操作符时被调用的普通函数，它们不属于某个类，也不会实例化一个类。

包括内置对象函数在内的所有函数都可以使用 new 操作符来调用，这种函数调用被称为构造函数调用。

实际上并不存在所谓的构造函数，只有对函数的 **构造调用**。

使用 new 来调用函数，会自动执行下面的操作：

1.  创建一个新对象
2.  这个新对象会被执行 [[Prototype]] 连接
3.  这个新对象会绑定到函数调用的 this
4.  如果函数没有返回其他对象，那么 new 表达式中函数调用会自动返回这个新对象
::: details new实现
```js
function objectFactory(Fn, ...args) {
  const obj = Object.create(Fn.prototype)
  const result = Fn.apply(obj, args)
	
  return result && typeof result === 'object' ? result : obj
}
```
:::

### 4、优先级

new 绑定 -> 显式绑定 -> 隐式绑定 -> 默认绑定

### 5、绑定例外

#### 1、被忽略的 this

把 null 或者 undefined 作为 this 的绑定对象传入 call、apply 或者 bind，这些值在调用时会被忽略，实际应用的是默认绑定。

总是传入 null 来忽略 this 绑定可能会产生一些副作用，如果某个函数确实使用了 this，那默认绑定规则会把 this 绑定到全局对象中。

更安全的做法是传入一个特殊的对象（空对象），把 this 绑定到这个对象中不会对你的程序产生任何的副作用。

#### 2、间接引用

间接引用下，调用这个函数会应用默认绑定规则。间接引用最容易在 **赋值** 时发生。

```js
// p.foo = o.foo的返回值是目标函数的引用，所以调用位置是foo()而不是p.foo()或者o.foo()
function foo() {
    console.log( this.a );
}

var a = 2;
var o = { a: 3, foo: foo };
var p = { a: 4};

o.foo(); // 3
(p.foo = o.foo)(); // 2
```

#### 3、软绑定

*   硬绑定可以把 this 强制绑定到指定对象（new 除外），防止函数调用应用默认绑定规则，但是会降低函数的灵活度，使用 **硬绑定后就无法使用隐式绑定或者显式绑定来修改 this**。
*   如果给默认绑定制定一个全局对象和 undefined 以外的值，那就实现和硬绑定相同的效果，同时保留隐式绑定或显式绑定修改 this 的能力。

```js
// 默认绑定规则，优先级排最后
// 如果this绑定到全局对象或者undefined，那就把指定的默认对象obj绑定到this,否则不会修改this
if(!Function.prototype.softBind) {
    Function.prototype.softBind = function(obj) {
        var fn = this;
        // 捕获所有curried参数
        var curried = [].slice.call( arguments, 1 ); 
        var bound = function() {
            return fn.apply(
            	(!this || this === (window || global)) ? 
                	obj : this,
                curried.concat.apply( curried, arguments )
            );
        };
        bound.prototype = Object.create( fn.prototype );
        return bound;
    };
}
```

:::info
ES6 新增了一种特殊函数类型：箭头函数，箭头函数无法使用上述四种规则，而是根据外层（函数或全局）作用域（词法作用域）来决定 this。

箭头函数的绑定无法被修改。
:::

