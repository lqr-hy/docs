# DOM-BOM

> - DOM Document Object Model 文档对象模型 将文档当作一个对象 这个对象主要定义了处理网页内容的方法和接口
> - BOM Browser Object Model 浏览器对象模型 将浏览器当作一个对象 主要定义了与浏览器进行交互的方法和接口

### 1、节点介绍

Node，是构成网页的最基本组成部分，网页中的每一个部分都可以称为一个节点。
html 标签、属性、文本、注释、文档都是一个节点，具体类型不同。
节点的类型不同，属性和方法也都不尽相同。

|          | nodeName  | noeType | nodeValue |
| :------- | :-------- | :------ | :-------- |
| 文档节点 | #document | 9       | null      |
| 元素节点 | 标签名    | 1       | null      |
| 属性节点 | 属性名    | 2       | 属性值    |
| 文本节点 | $text     | 3       | 文本内容  |

#### 1、文档节点#document

document 代表整个 HTML 文档，网页中的所有节点都是它的**子节点**。
document 对象作为 window 对象的属性存在，不用获取可以直接使用。
通过该对象我们可以在整个文档访问内查找节点对象，并可以通过该对象创建各种节点对象。

> HTML 结构相关
>
> > - document.head 返回当前文档头
> > - document.title 返回当前文档标题
> > - document.body 返回当前文档主体
> > - document.documentElement 返回文档对象的根源素 html
>
> url 相关
>
> > - document.URL 返回当前文档 URL 地址
> > - document.baseURI 返回当前节点绝对 URL
> > - document.documentURI 返回文档的位置(location) 与 URL 不同点 适用于所有类型的文档
> > - document.cookie

#### 2、元素节点 Element

HTML 各种标签都是元素节点，最常用的一个节点。

#### 3、属性节点 Attr

标签中的一个一个的属性，属性节点并非是元素节点的子节点，而是元素节点的一部分。
可以通过元素节点来获取指定的属性节点。
注意：一般不使用属性节点。

#### 4、文本节点 Text

HTML 标签以外的文本内容，任意非 HTML 的文本都是文本节点，包括可以字面解释的文本内容。
一般作为元素节点的子节点存在。
获取文本节点时，一般先要获取元素节点，通过元素节点获取文本节点。

**注意：浏览器已经提供文档节点对象，这个对象是 window，可以在页面中直接使用，文档节点代表整个网页**

### 2、获取节点方法

- 通过 document 对象调用
- getElementById() 通过 id 属性获取一个元素节点对象
- getElementsByTagName() 通过标签名获取一组元素节点对象
- getElementsByName() 通过 name 属性获取一组元素节点对象
- getElementsByClassName() 通过元素 class 属性值查询一组元素节点对象，IE8 以下不支持
- document.querySelector() 根据一个 CSS 选择器来查询一个元素节点对象 该方法总会返回唯一的一个元素
- document.querySelectorAll() 该方法和 querySelector()用法类似，不同的是它会将符合条件的元素封装到一个数组中返回
  > 1. 根据 ID 获取元素后，通过 innerHTML 可以获取到元素内部 HTML 代码。
  > 2. 根据标签名或 name 获取一组对象时，返回一个类数组对象，即使查询到的元素只有一个，也会封装到数组中返回。
  > 3. innerHTML 对于自结束标签，这个属性没有意义。如果需要读取元素节点属性，直接使用 元素.属性名 **注意：class 属性不能采用这种方式**
  > 4. 读取 class 属性时需要使用元素 .className

:::info querySelector 和 getElementById 区别
getElementById 获取的是动态的节点 后期 js 操作的增删改查都可以实时反应出来

querySelector 获取的静态的节点 后期 js 操作的增删改查无法反应出来
:::

### 3、获取节点属性

#### 1、获取子节点

> - childNodes：表示当前节点的所有子节点。
> - children：获取当前元素的所有子元素。
> - firstChild：表示当前节点的第一个子节点。
> - firstElementChild：获取当前元素的第一个子元素。
> - lastChild：表示当前节点的最后一个子节点。
> - lastElementChild：获取当前元素的最后一个子元素。

:::info 注意
childNodes 会获取包括文本节点在内的所有节点，根据 DOM 标签标签间空白也会当成空白节点

IE8 及以下的浏览器中不会将空白文本当成子节点

firstElementChild 不支持 IE8 以下浏览器
:::

#### 2、获取父节点和兄弟节点

> - parentNode：当前节点的父节点
> - previousSibling：当前节点的前一个兄弟节点，可能会获取到空白文本
> - previousElementSibling：获取前一个兄弟元素，IE8 以下不支持
> - nextSibling：当前节点的后一个兄弟节点
> - nextElementSibling：获取后一个兄弟元素，IE8 以下不支持

#### 3、元素拷贝

cloneNode( true / false ) false：浅拷贝；true：深拷贝。

#### 4、inner

- innerHTML：设置或获取位于对象起始和结束标签内的 HTML
- innerText：设置或获取位于对象起始和结束标签内的文本。标签名不会被解析，当作字符原样输出

#### 5、outer

- outerHTML：设置或获取对象及其内容的 HTML 形式。与 innerHTML 不同的是，对象本身的标签也包含进去了。在设置 outerHTML 时，和 innerHTML 一样
- outerText：设置(包括标签)或获取(不包括标签)对象的文本

:::info 区别
innerHTML 与 outerHTML 在设置对象的内容时包含的 HTML 会被解析，而 innerText 与 outerText 则不会

在设置时，innerHTML 与 innerText 仅设置标签内的文本，而 outerHTML 与 outerText 设置包括标签在内的文本
:::

### 4、其余节点方法

- document.body 获取 body 标签 保存的是 body 的引用。
- document.documentElement 获取 html 根标签 保存 html 根标签
- document.all == document.getElementByTagName("\*"); 获取页面中所有元素

### 5、增删改节点方法

| 方法                   | 描述                             |
| :--------------------- | :------------------------------- |
| appendChild()          | 把新的子节点添加到指定节点       |
| removeChild()          | 删除子节点                       |
| replaceChild()         | 替换子节点                       |
| insertBefore()         | 在指定的子节点前面插入新的子节点 |
| createAttribute()      | 创建属性节点                     |
| createElement()        | 创建元素节点                     |
| cratedTextNode()       | 创建文本节点                     |
| getAttribute()         | 返回指定的属性值                 |
| setAttribute()         | 把指定属性设置或修改为指定的值   |
| A.parentNode.remove(A) | 元素自删                         |

:::info
createAttribute()、createTextNode()只能在 document 对象下创建

createElement()可以在任何元素节点下创建

使用 innerHTML 也可以完成 DOM 的增删改的相关操作
:::

### 6、动态创建元素

- document.write()：直接将内容写入页面的内容流，但是文档流执行完毕，会导致整个页面全部重绘。
- element.innerHTML：将内容写入某个 DOM 节点，不会导致页面全部重绘，创建多个元素效率更高（不要拼接字符串，采取数组形式拼接），结构稍微复杂。
- document.createElement()：创建多个元素效率稍低一点，但是结构更清晰。

### 7、属性节点

- attributes 获取属性节点的集合
- getAttributeNode 获取属性节点对象
- getAttribute("class")获取属性节点的值
- setAttribute("class","name")设置属性节点的值 （可设置非标准属性）
- hasAttribute("class") 判断属性节点是否存在

### 8、classList

classList 属性返回元素的类名，作为 DOMTokenList 对象。该属性用于在元素中添加，移除及切换 CSS 类。

> - add(class1, class2, ……) 在元素中添加一个或多个类名 如果指定的类名已存在，则不会添加
> - contains(class) 返回布尔值，判断指定的类名是否存在 可能值：true，元素已包含了该类名；false，元素不存在该类名。
> - item(index) 返回元素中索引值对应的类名，索引值从 0 开始 如果索引值在区间范围外返回 null
> - remove(class1, class2, ……) 移除元素中一个或多个类名 移除不存在的类名，不会报错。
> - toggle(class, true|false) 在元素中切换类名
>   > 第一个参数为要在元素中移除的类名，并返回 false。
>   >
>   > 如果该类名不存在则会在元素中添加类名，并返回 true。
>   >
>   > 第二个是可选参数，是个布尔值用于设置元素是否强制添加或者移除类，不管该类名是否存在。

**注意**：IE 或 Opera 12 及其更早版本不支持第二个参数。

### 9、dataset

添加自定义属性之后，在 JS 中可以通过元素的 dataset 属性访问自定义属性。dataset 属性的值是一个 DOMStringMap 实例，也就是一个键值对的映射。在这个映射中，每个 data-\* 形式的属性都会有一个对应的属性，只不过属性名没有 data- 前缀。

### 10、读取设置内联样式

语法：元素.style.样式名 = 样式值;

1. 注意：如果 CSS 样式名中含有"-"，这种样式不合法，需要改为驼峰命名法。
2. 通过 style 设置的样式都是内联样式，内联样式优先级很高，所以 JS 修改样式基本会立即显示。
3. 如果原有样式中写了!important，样式拥有最高优先级，JS 也无法覆盖，会导致 JS 修改失败。
4. 通过 style 属性设置和读取的都是内联样式。

### 11、获取元素样式

IE 语法：元素.currentStyle.样式名 **注意**！只有 IE 浏览器支持

- 如果当前元素没有设置该样式，则获取默认值。

其他浏览器 语法：​ getComputedStyle()方法，window 方法，可直接使用。 IE8 以下不支持

需要两个参数：1、获取样式的元素；2、可传递伪元素，一般为 null。

通用语法：

```js
function getStyle(obj, name) {
  return window.getComputedStyle ? getComputedStyle(obj, null)[name] : obj.currentStyle[name]
}
```

- 如果获取的样式没有设置，则会获取到真实值，而不是默认值。

通过上述两种语法获取的样式都是只读的，不能写。如果要修改必须通过 style 属性。

```js
// 将获取到的首个p标签隐藏
document.querySelector('p').style.display = 'none'
```

### 12、元素宽高移动属性

获得元素距离带有定位父元素的位置 获得元素自身的大小（宽度高度）返回的数值都不带单位。

1. offsetWidth、offsetHeight 获取元素的整个宽度和高度，包括内容区、内边距和边框
2. offsetParent 可以用来获取当前元素的定位父元素 会获取到离当前元素最近的开启了定位的祖先元素
3. offsetLeft、offsetTop 当前元素相对于其定位父元 素的水平偏移量 当前元素相对于其定位父元素的垂直偏移量
4. offset 与 style 的区别

| offset                                | style                                         |
| :------------------------------------ | :-------------------------------------------- |
| offset 可以得到任意样式表中的样式值   | style 只能得到行内样式表中的样式值            |
| offset 系列获得的数值是没有单位的     | style.width 获得的是带有单位的字符串          |
| offsetWidth 包含 padding+border+width | style.width 获得不包含 padding 和 border 的值 |
| offsetWidth 等属性只读，不可赋值      | style.width 是可读写属性                      |
| 想要获取元素大小位置，offset 更合适   | 想要给元素更改值，需要用 style 改变           |

### 13、元素可视区系列

1. clientTop、clientLeft 返回元素上边框、左边框的大小。
2. clientWidth、clientHeight 这两个属性可以获取元素的可见宽度和高度

:::info 注意
这些属性都是不带 px 的，返回都是一个数字，可以直接进行计算
会获取元素宽度和高度，包括内容区和内边距
这些属性都是只读的，不能修改
:::

### 14、元素滚动系列

1. scrollWidth、scrollHeight 可以获取元素整个滚动区域的宽度和高度
2. scrollLeft、scrollTop 可以获取水平滚动条滚动的距离 可以获取垂直滚动条滚动的距离

> 滚动到底
>
> > - 当满足 scrollHeight - scrollTop == clientHeight
> > - 说明垂直滚动条到底当满足 scrollWidth - scrollLeft == clientWidth
> > - 说明水平滚动条到底 chrome 认为浏览器的滚动条是 body 的，可以通过 body.scrollTop 来获取

2021 年更新：chrome 不再认为滚动条是 body 的，只能通过 document.documentElement.scrollTop 来获取。

| 三大系列大小对比    | 作用                                                           |
| ------------------- | -------------------------------------------------------------- |
| element.offsetWidth | 返回自身包括 padding、边框、内容区的宽度，返回数值不带单位     |
| element.clientWidth | 返回自身包括 padding、内容区的宽度，不含边框，返回数值不带单位 |
| element.scrollWidth | 返回自身实际的宽度，不含边框，返回数值不带单位                 |

### 15、事件

文档或浏览器窗口中发生的一些特定的交互瞬间。当事件的响应函数被触发时，浏览器每次会将一个事件对象作为实参传递进响应函数，在事件对象中封装了当前事件相关的一切信息，比如：鼠标坐标、键盘按键、鼠标滚轮滚动方向。

JS 与 HTML 之间的交互是通过事件实现的。

| 鼠标事件    | 触发条件         |
| :---------- | :--------------- |
| onclick     | 鼠标点击左键触发 |
| onmouseover | 鼠标经过触发     |
| onmouseout  | 鼠标离开触发     |
| onfocus     | 获得鼠标焦点触发 |
| onblur      | 失去鼠标焦点触发 |
| onmousemove | 鼠标移动触发     |
| onmouseup   | 鼠标弹起触发     |
| onmousedown | 鼠标按下触发     |

> 弃用写法
> 事件对应属性中设置 js 代码，当事件被触发时，代码执行。

```html
<div onclick="alert('点击测试')">点击测试文本</div>
```

耦合不方便维护、不推荐使用。

#### 1、滚动条事件 onscroll

- clientX、clientY 获取鼠标指针的水平、垂直坐标
- pageX、PageY 获取鼠标相对于当前页面坐标。
- IE8 以下不支持。

#### 2、页面被卷去的头部

如果浏览器的高（或宽）度不足以显示整个页面时，会自动出现滚动条，当滚动条向下滚动时， 页面上面被隐藏掉的高度，我们就称为页面被卷去的头部。滚动条在滚动时会触发 onscroll 事件。

三大获取方案：

1. 声明了 DTD，使用 document.documentElement.scrollTop
2. 未声明 DTD，使用 document.body.scrollTop
3. 新方法 window.pageYOffset 和 window.pageXOffset，IE9 开始支持

```js
<script>
function getScroll() {
return {
	left: window.pageXOffset || document.documentElement.scrollLeft || doc
ument.body.scrollLeft || 0,
	top: window.pageYOffset || document.documentElement.scrollTop || docum
ent.body.scrollTop || 0
	};
}
// 使用的时候：getScroll().left
</script>
```

#### 3、事件冒泡

- 事件的向上传导，当后代元素上的事件触发时，其祖先元素的相同事件也会被触发。
- 在开发中大部分情况冒泡都是有用的，如果不希望发生事件冒泡可以通过事件来取消冒泡。
- event.cancelBubble = true;
  > 捕获阶段
  >
  > > - 捕获阶段时从最外层祖先元素开始，向目标元素进行事件捕获，默认不会触发事件。
  >
  > 目标阶段
  >
  > > - 事件捕获到目标元素，捕获结束开始在目标元素上触发事件。
  >
  > 冒泡阶段
  >
  > > - 事件从目标元素向他的祖先元素开始传递。
  >
  > 捕获阶段触发
  >
  > > - addEventListener()第三个参数设置为 true。一般不会希望在捕获阶段触发事件，所以一般设为 false。

#### 4、新增 mouseenter

当鼠标移动到元素上时就会触发 mouseenter 事件，类似于 mouseover，它们两者之间的差别是：

1. mouseover 鼠标经过自身盒子会触发，经过子盒子还会触发
2. mouseenter 只会经过自身盒子触发，这是因为 mouseenter 不会冒泡
3. 与 mouseenter 对应的还有 mouseleave（鼠标移出）。

#### 5、事件委派

将事件统一绑定给元素的共同祖先元素，后代元素触发时，一直冒泡到祖先元素，通过祖先元素来处理事件。

- 优点：减少事件绑定次数，提高程序性能。
- Event.target 返回触发时此事件的元素（事件的目标节点）。

#### 6、事件绑定

##### 1、传统绑定

使用 对象.事件 = 函数 的形式绑定响应函数，

```js
function f(e) {
  console.log(e.target.innerText)
}
div.onclick = f
```

> - 它只能同时为一个元素的一个事件绑定一个响应函数，
> - 不能绑定多个，后面会覆盖前边。
> - 如果 对象.事件 = null，则事件无触发。

##### 2、事件监听器

addEventListener() IE8 不支持
通过这个方法也可以为元素绑定响应函数

> - 参数：1、事件字符串，不要 on；2、回调函数，事件触发时被调用；3、是否在捕获阶段触发，需要一个布尔值，一般都传 false。
> - 使用 addEventListener()可以同时为一个元素的相同事件同时绑定多个响应函数，这样当事件被触发时，响应函数将会按照函数绑定顺序执行。
> - 该方法里的 this 是绑定事件对象

attachEvent() IE8 支持

> 参数：1、事件的字符串，要 on；2、回调函数。
> 后绑定先执行，执行顺序和 addEventListener()相反。
> 该方法里的 this 是 window

#### 7、拖拽事件

ondrag 事件在元素或者选取的文本被拖动时触发

:::info 注意点
为了让元素可拖动，需要使用 HTML5 draggable 属性。

接和图片默认是可拖动的，不需要 draggable 属性。
:::

在拖动目标上触发事件 (源元素):

- ondragstart - 用户开始拖动元素时触发
- ondrag - 元素正在拖动时触发
- ondragend - 用户完成元素拖动后触发

释放目标时触发的事件:

- ondragenter - 当被鼠标拖动的对象进入其容器范围内时触发此事件
- ondragover - 当某被拖动的对象在另一对象容器范围内拖动时触发此事件
- ondragleave - 当被鼠标拖动的对象离开其容器范围内时触发此事件
- ondrop - 在一个拖动过程中，释放鼠标键时触发此事件
  :::info
  在拖动元素时，每隔 350 毫秒会触发 ondrag 事件
  :::

#### 8、滚轮事件

- onmousewheel：老版本浏览器名称，
- 老版本火狐使用 DOMMouseScroll 绑定滚动，需要通过 addEventListener()绑定
- 当前新版名称：**onwheel**

> 获取滚轮长度
>
> > 1.  判断滚轮滚动方向 事件属性 event.wheelDelta 向上滚 120 向下滚-120
> > 2.  火狐旧版本不支持 需使用 event.detail（当前测试新版本火狐也支持 wheelDelta） 向上滚-3 向下滚 3

:::info
使用 addEventListener()方法绑定响应函数，取消默认行为时不能使用 return false;

需要使用 event 取消默认行为 event.preventDefault(); （IE8 不支持）
:::

#### 9、键盘事件

onkeydown：按键按下；onkeyup：按键松开。

- 如果一直按着某个按键不松手，事件会一直触发。
- onkeydown 连续触发时，第一次和第二次会间隔略长，其他会非常快。原因是为了防止误操作。
- 文本框中输入内容，属于 onkeydown 默认行为，如果 onkeydown 取消了默认行为，则输入的内容，不会出现在文本框中。

**键盘属性**

| 属性          | 描述                                           |
| :------------ | :--------------------------------------------- |
| altKey        | 返回当事件触发时，ALT 是否被按下               |
| button        | 返回当事件触发时，某个鼠标按钮是否被按下       |
| clientX       | 返回当事件触发时，鼠标指针的水平是否被按下     |
| clientY       | 返回当事件触发时，鼠标指针的垂直坐标是否被按下 |
| ctrlKey       | 返回当事件触发时，CTRL 键是否被按下            |
| metaKey       | 返回当事件触发时，meta 键是否被按下            |
| relatedTarget | 返回与事件的目标节点相关的节点                 |
| screenX       | 返回当事件触发时，鼠标指针距离屏幕的水平坐标   |
| screenY       | 返回当事件触发时，鼠标指针距离屏幕的垂直坐标   |
| shiftKey      | 返回当事件触发时，SHIFT 键是否被按下           |

> key
>
> > - 老版本浏览器：keyCode 获取按键编码，新版本使用 key
> > - keyCode：返回定义键码值编码
> > - key：返回按键字符或字符串
