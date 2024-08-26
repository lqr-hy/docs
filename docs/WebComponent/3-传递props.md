# 传递 props

在 Web Components 中，传递 props（属性）可以通过自定义元素的属性和属性变化观察器来实现。这与 React 或 Vue 中传递 props 的方式不同。在 Web Components 中，属性传递是通过设置 HTML 元素的属性来实现的，同时可以使用属性变化观察器（`attributeChangedCallback`）来监听属性的变化。

以下是一个示例，展示了如何在 Web Components 中传递和监听属性。

### 示例：传递和监听属性

#### 1. 定义自定义元素

我们将定义一个自定义元素 `<my-element>`，它可以接收并显示一个 `name` 属性。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Web Components Example</title>
  </head>
  <body>
    <my-element name="John Doe"></my-element>

    <script>
      class MyElement extends HTMLElement {
        static get observedAttributes() {
          return ['name']
        }

        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
          this.shadowRoot.innerHTML = `
          <div>
            Hello, <span id="name"></span>!
          </div>
        `
        }

        connectedCallback() {
          this.updateName()
        }

        attributeChangedCallback(name, oldValue, newValue) {
          if (name === 'name') {
            this.updateName()
          }
        }

        updateName() {
          const name = this.getAttribute('name')
          this.shadowRoot.querySelector('#name').textContent = name
        }
      }

      customElements.define('my-element', MyElement)
    </script>
  </body>
</html>
```

#### 2. 解释代码

1. **`observedAttributes`**: 静态方法 `observedAttributes` 返回一个属性名称数组，这些属性名称对应于我们希望观察的属性变化。在这个示例中，我们只观察 `name` 属性。

2. **`constructor`**: 构造函数中，我们附加了一个 Shadow DOM 并定义了元素的初始结构。

3. **`connectedCallback`**: 当元素被插入到 DOM 中时调用 `connectedCallback`，我们在这里调用 `updateName` 方法来初始化显示的名称。

4. **`attributeChangedCallback`**: 当观察的属性变化时调用 `attributeChangedCallback`，在这里我们检测到 `name` 属性变化并更新显示的名称。

5. **`updateName`**: 这个方法获取 `name` 属性的值并更新 Shadow DOM 中相应元素的内容。

#### 3. 动态更新属性

我们还可以动态更新属性，并看到变化反映在组件中。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Web Components Example</title>
  </head>
  <body>
    <my-element id="myElement" name="John Doe"></my-element>
    <button id="changeNameButton">Change Name</button>

    <script>
      class MyElement extends HTMLElement {
        static get observedAttributes() {
          return ['name']
        }

        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
          this.shadowRoot.innerHTML = `
          <div>
            Hello, <span id="name"></span>!
          </div>
        `
        }

        connectedCallback() {
          this.updateName()
        }

        attributeChangedCallback(name, oldValue, newValue) {
          if (name === 'name') {
            this.updateName()
          }
        }

        updateName() {
          const name = this.getAttribute('name')
          this.shadowRoot.querySelector('#name').textContent = name
        }
      }

      customElements.define('my-element', MyElement)

      document.getElementById('changeNameButton').addEventListener('click', () => {
        const myElement = document.getElementById('myElement')
        myElement.setAttribute('name', 'Jane Doe')
      })
    </script>
  </body>
</html>
```

在这个示例中，当点击按钮时，我们动态地更新了 `<my-element>` 的 `name` 属性，从而触发 `attributeChangedCallback` 并更新显示的名称。
